import supabase from './supabase';

// Helper to enrich bilty list with city names
const enrichBiltyWithCities = async (biltyList) => {
  if (!biltyList || biltyList.length === 0) return biltyList;
  
  const cityIds = new Set();
  biltyList.forEach(b => {
    if (b.from_city_id) cityIds.add(b.from_city_id);
    if (b.to_city_id) cityIds.add(b.to_city_id);
  });
  
  if (cityIds.size === 0) {
    return biltyList.map(b => ({ ...b, from_city_name: 'N/A', to_city_name: 'N/A' }));
  }
  
  const { data: cities } = await supabase
    .from('cities')
    .select('id, city_name, city_code')
    .in('id', Array.from(cityIds));
  
  const cityMap = {};
  (cities || []).forEach(c => { cityMap[c.id] = c; });
  
  return biltyList.map(b => ({
    ...b,
    from_city_name: b.from_city_id ? cityMap[b.from_city_id]?.city_name || 'N/A' : 'N/A',
    to_city_name: b.to_city_id ? cityMap[b.to_city_id]?.city_name || 'N/A' : 'N/A',
    from_city_code: b.from_city_id ? cityMap[b.from_city_id]?.city_code || '' : '',
    to_city_code: b.to_city_id ? cityMap[b.to_city_id]?.city_code || '' : '',
  }));
};

// Enrich single bilty with city names
const enrichSingleBiltyWithCities = async (bilty) => {
  if (!bilty) return bilty;
  
  const cityIds = [];
  if (bilty.from_city_id) cityIds.push(bilty.from_city_id);
  if (bilty.to_city_id) cityIds.push(bilty.to_city_id);
  
  if (cityIds.length === 0) {
    return { ...bilty, from_city_name: 'N/A', to_city_name: 'N/A' };
  }
  
  const { data: cities } = await supabase
    .from('cities')
    .select('id, city_name, city_code')
    .in('id', cityIds);
  
  const cityMap = {};
  (cities || []).forEach(c => { cityMap[c.id] = c; });
  
  return {
    ...bilty,
    from_city_name: bilty.from_city_id ? cityMap[bilty.from_city_id]?.city_name || 'N/A' : 'N/A',
    to_city_name: bilty.to_city_id ? cityMap[bilty.to_city_id]?.city_name || 'N/A' : 'N/A',
    from_city_code: bilty.from_city_id ? cityMap[bilty.from_city_id]?.city_code || '' : '',
    to_city_code: bilty.to_city_id ? cityMap[bilty.to_city_id]?.city_code || '' : '',
  };
};

// Fetch single bilty by GR number
export const fetchBiltyByGR = async (grNo) => {
  try {
    const { data, error } = await supabase
      .from('bilty')
      .select('*')
      .ilike('gr_no', grNo)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      const enrichedData = await enrichSingleBiltyWithCities(data);
      return { success: true, data: enrichedData };
    }
    
    return { success: false, data: null };
  } catch (error) {
    console.error('Fetch Bilty by GR Error:', error);
    return { success: false, error: error.message };
  }
};

// Get bilty by ID
export const fetchBiltyById = async (biltyId) => {
  try {
    const { data, error } = await supabase
      .from('bilty')
      .select('*')
      .eq('id', biltyId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      const enrichedData = await enrichSingleBiltyWithCities(data);
      return { success: true, data: enrichedData };
    }
    
    return { success: false, data: null };
  } catch (error) {
    console.error('Fetch Bilty by ID Error:', error);
    return { success: false, error: error.message };
  }
};

// Get bilty statistics for a consignor
export const getBiltyStats = async (consignor) => {
  try {
    const { companyName, phoneNumber, gstNumber } = consignor;
    
    let query = supabase
      .from('bilty')
      .select('id, saving_option')
      .eq('is_active', true)
      .is('deleted_at', null);

    if (companyName && phoneNumber && gstNumber) {
      query = query.or(`consignor_name.ilike.%${companyName}%,consignor_number.eq.${phoneNumber},consignor_gst.ilike.%${gstNumber}%`);
    } else if (companyName && phoneNumber) {
      query = query.or(`consignor_name.ilike.%${companyName}%,consignor_number.eq.${phoneNumber}`);
    } else if (companyName) {
      query = query.ilike('consignor_name', `%${companyName}%`);
    } else if (phoneNumber) {
      query = query.eq('consignor_number', phoneNumber);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data?.length || 0;
    const delivered = data?.filter(b => b.saving_option === 'DELIVERED').length || 0;
    const inTransit = data?.filter(b => b.saving_option === 'SAVE' || b.saving_option === 'IN_TRANSIT').length || 0;
    const atHub = data?.filter(b => b.saving_option === 'AT_HUB').length || 0;

    return {
      success: true,
      stats: { total, delivered, inTransit, atHub, active: total - delivered }
    };
  } catch (error) {
    console.error('Get Bilty Stats Error:', error);
    return { 
      success: false, 
      error: error.message,
      stats: { total: 0, delivered: 0, inTransit: 0, atHub: 0, active: 0 }
    };
  }
};

// Get recent bilty for a consignor (last 5)
export const getRecentBilty = async (consignor, limit = 5) => {
  try {
    const { companyName, phoneNumber, gstNumber } = consignor;
    
    let query = supabase
      .from('bilty')
      .select('id, gr_no, consignor_name, consignee_name, bilty_date, saving_option, total, no_of_pkg, wt, from_city_id, to_city_id, payment_mode')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (companyName && phoneNumber && gstNumber) {
      query = query.or(`consignor_name.ilike.%${companyName}%,consignor_number.eq.${phoneNumber},consignor_gst.ilike.%${gstNumber}%`);
    } else if (companyName && phoneNumber) {
      query = query.or(`consignor_name.ilike.%${companyName}%,consignor_number.eq.${phoneNumber}`);
    } else if (companyName) {
      query = query.ilike('consignor_name', `%${companyName}%`);
    } else if (phoneNumber) {
      query = query.eq('consignor_number', phoneNumber);
    }

    const { data, error } = await query;

    if (error) throw error;

    const enrichedData = await enrichBiltyWithCities(data || []);
    return { success: true, data: enrichedData };
  } catch (error) {
    console.error('Get Recent Bilty Error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Search bilty with filters
export const searchBilty = async (consignor, filters = {}) => {
  try {
    const { companyName, phoneNumber, gstNumber } = consignor;
    const { searchTerm, startDate, endDate, status, page = 1, pageSize = 20 } = filters;
    
    let query = supabase
      .from('bilty')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (companyName && phoneNumber && gstNumber) {
      query = query.or(`consignor_name.ilike.%${companyName}%,consignor_number.eq.${phoneNumber},consignor_gst.ilike.%${gstNumber}%`);
    } else if (companyName && phoneNumber) {
      query = query.or(`consignor_name.ilike.%${companyName}%,consignor_number.eq.${phoneNumber}`);
    } else if (companyName) {
      query = query.ilike('consignor_name', `%${companyName}%`);
    } else if (phoneNumber) {
      query = query.eq('consignor_number', phoneNumber);
    }

    if (searchTerm) {
      query = query.or(`gr_no.ilike.%${searchTerm}%,consignee_name.ilike.%${searchTerm}%,invoice_no.ilike.%${searchTerm}%`);
    }

    if (startDate) query = query.gte('bilty_date', startDate);
    if (endDate) query = query.lte('bilty_date', endDate);
    if (status) query = query.eq('saving_option', status);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const enrichedData = await enrichBiltyWithCities(data || []);
    return { 
      success: true, 
      data: enrichedData, 
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error('Search Bilty Error:', error);
    return { success: false, error: error.message, data: [], total: 0 };
  }
};
