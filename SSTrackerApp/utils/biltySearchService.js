import supabase, { supabaseUrl, supabaseAnonKey } from './supabase';

// Search GR numbers from both bilty and station_bilty_summary tables
export const searchGrSuggestions = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return { success: true, suggestions: [] };
  }

  try {
    const term = searchTerm.trim().toLowerCase();

    // Search regular bilty table
    const { data: regularBilties, error: regError } = await supabase
      .from('bilty')
      .select('gr_no, consignor_name, consignee_name, bilty_date, saving_option, from_city_id, to_city_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .ilike('gr_no', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (regError) console.error('Regular bilty search error:', regError);

    // Search station/manual bilty table
    const { data: stationBilties, error: stnError } = await supabase
      .from('station_bilty_summary')
      .select('gr_no, consignor, consignee, station, payment_status, delivery_type, created_at')
      .ilike('gr_no', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (stnError) console.error('Station bilty search error:', stnError);

    // Combine and deduplicate by gr_no
    const seen = new Set();
    const suggestions = [];

    // Add regular bilties first
    (regularBilties || []).forEach(b => {
      const key = b.gr_no?.toUpperCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        suggestions.push({
          gr_no: b.gr_no,
          consignor: b.consignor_name || 'N/A',
          consignee: b.consignee_name || 'N/A',
          date: b.bilty_date,
          type: 'REG',
          status: b.saving_option || 'SAVE',
        });
      }
    });

    // Add station bilties
    (stationBilties || []).forEach(b => {
      const key = b.gr_no?.toUpperCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        suggestions.push({
          gr_no: b.gr_no,
          consignor: b.consignor || 'N/A',
          consignee: b.consignee || 'N/A',
          date: b.created_at,
          type: 'MANUAL',
          station: b.station,
          status: b.payment_status || 'to-pay',
        });
      }
    });

    return { success: true, suggestions };
  } catch (error) {
    console.error('Search GR suggestions error:', error);
    return { success: false, suggestions: [], error: error.message };
  }
};

// Get full bilty details - searches both tables
export const getFullBiltyDetails = async (grNo) => {
  if (!grNo) return { success: false, data: null };

  try {
    // Try regular bilty first
    const { data: regBilty, error: regError } = await supabase
      .from('bilty')
      .select('*')
      .ilike('gr_no', grNo)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    if (regError && regError.code !== 'PGRST116') {
      console.error('Regular bilty fetch error:', regError);
    }

    if (regBilty) {
      // Enrich with city names
      const cityIds = [];
      if (regBilty.from_city_id) cityIds.push(regBilty.from_city_id);
      if (regBilty.to_city_id) cityIds.push(regBilty.to_city_id);

      let from_city_name = 'N/A', to_city_name = 'N/A';
      if (cityIds.length > 0) {
        const { data: cities } = await supabase
          .from('cities')
          .select('id, city_name')
          .in('id', cityIds);

        const cityMap = {};
        (cities || []).forEach(c => { cityMap[c.id] = c.city_name; });
        from_city_name = cityMap[regBilty.from_city_id] || 'N/A';
        to_city_name = cityMap[regBilty.to_city_id] || 'N/A';
      }

      return {
        success: true,
        data: {
          ...regBilty,
          from_city_name,
          to_city_name,
          bilty_type: 'REG',
        },
      };
    }

    // Try station/manual bilty
    const { data: stnBilty, error: stnError } = await supabase
      .from('station_bilty_summary')
      .select('*')
      .ilike('gr_no', grNo)
      .maybeSingle();

    if (stnError && stnError.code !== 'PGRST116') {
      console.error('Station bilty fetch error:', stnError);
    }

    if (stnBilty) {
      return {
        success: true,
        data: {
          ...stnBilty,
          bilty_type: 'MANUAL',
          from_city_name: stnBilty.station || 'N/A',
          to_city_name: 'N/A',
          gr_no: stnBilty.gr_no,
          consignor_name: stnBilty.consignor,
          consignee_name: stnBilty.consignee,
          no_of_pkg: stnBilty.no_of_packets,
          wt: stnBilty.weight,
          contain: stnBilty.contents,
          total: stnBilty.amount,
          payment_mode: stnBilty.payment_status,
          delivery_type: stnBilty.delivery_type,
          pvt_marks: stnBilty.pvt_marks,
          bilty_date: stnBilty.created_at,
          bilty_image: stnBilty.bilty_image,
          saving_option: stnBilty.payment_status === 'paid' ? 'DELIVERED' : 'SAVE',
        },
      };
    }

    return { success: false, data: null };
  } catch (error) {
    console.error('Get full bilty details error:', error);
    return { success: false, data: null, error: error.message };
  }
};

// Call upsert_search_tracking RPC when a bilty is selected
export const trackBiltySearch = async (grNo, userId, sourceType = 'MOB') => {
  try {
    const { data, error } = await supabase.rpc('upsert_search_tracking', {
      p_gr_no: grNo,
      p_user_id: userId,
      p_source_type: sourceType,
    });

    if (error) {
      console.error('Track search error:', error);
      return { success: false, trackingData: null };
    }

    return { success: true, trackingData: data?.[0] || null };
  } catch (error) {
    console.error('Track bilty search error:', error);
    return { success: false, trackingData: null };
  }
};

// Upload bilty image to Supabase storage "bilty" bucket and update DB
export const uploadBiltyImage = async (biltyId, grNo, biltyType, imageUri) => {
  try {
    // Generate file path: bilty-images/{gr_no}_{timestamp}.{ext}
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const filePath = `bilty-images/${grNo}_${timestamp}.${fileExt}`;

    // Build FormData — React Native natively reads local file URIs from FormData
    // (fetch→blob does NOT work in RN — blob comes out empty/162 bytes)
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: `${grNo}_${timestamp}.${fileExt}`,
      type: fileExt === 'png' ? 'image/png' : 'image/jpeg',
    });

    // Direct REST call to Supabase Storage API
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/bilty/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'x-upsert': 'true',
        },
        body: formData,
      }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error('Upload error:', uploadRes.status, errBody);
      return { success: false, error: `Upload failed (${uploadRes.status}): ${errBody}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bilty')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      return { success: false, error: 'Failed to get public URL' };
    }

    // Update bilty_image column in the correct table
    const tableName = biltyType === 'MANUAL' ? 'station_bilty_summary' : 'bilty';
    const { error: dbError } = await supabase
      .from(tableName)
      .update({ bilty_image: publicUrl })
      .eq('id', biltyId);

    if (dbError) {
      console.error('DB update error:', dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true, imageUrl: publicUrl };
  } catch (error) {
    console.error('Upload bilty image error:', error);
    return { success: false, error: error.message };
  }
};

// Remove bilty image from storage and set bilty_image to null
export const removeBiltyImage = async (biltyId, biltyType, currentImageUrl) => {
  try {
    // Delete file from "bilty" bucket if URL exists
    if (currentImageUrl && currentImageUrl.includes('/bilty/bilty-images/')) {
      const parts = currentImageUrl.split('/bilty/');
      const storagePath = parts[parts.length - 1]; // "bilty-images/20107_123456.jpg"
      await supabase.storage.from('bilty').remove([storagePath]);
    }

    // Set bilty_image = null in the correct table
    const tableName = biltyType === 'MANUAL' ? 'station_bilty_summary' : 'bilty';
    const { error } = await supabase
      .from(tableName)
      .update({ bilty_image: null })
      .eq('id', biltyId);

    if (error) {
      console.error('Remove image DB error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Remove bilty image error:', error);
    return { success: false, error: error.message };
  }
};
