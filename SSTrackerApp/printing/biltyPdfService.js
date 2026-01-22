// biltyPdfService.js - Service for fetching all data needed for PDF generation
import supabase from '../utils/supabase';

/**
 * Fetch bilty data by GR number
 */
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
    return { success: true, data };
  } catch (error) {
    console.error('Fetch Bilty by GR Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch bilty data by ID
 */
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
    return { success: true, data };
  } catch (error) {
    console.error('Fetch Bilty by ID Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch city data by ID
 */
export const fetchCityById = async (cityId) => {
  if (!cityId) return { success: true, data: null };
  
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fetch City Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch branch data by ID
 */
export const fetchBranchById = async (branchId) => {
  if (!branchId) return { success: true, data: null };
  
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fetch Branch Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch transport data by name
 */
export const fetchTransportByName = async (transportName) => {
  if (!transportName) return { success: true, data: null };
  
  try {
    const { data, error } = await supabase
      .from('transports')
      .select('*')
      .ilike('transport_name', `%${transportName}%`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fetch Transport Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch permanent details (company info)
 * Table columns: id, branch_id, transport_name, gst, mobile_number,
 * bank_act_no_1, ifsc_code_1, bank_act_no_2, ifsc_code_2, transport_address, website
 */
export const fetchPermanentDetails = async (branchId = null) => {
  try {
    let query = supabase
      .from('permanent_details')
      .select('*');
    
    // If branch_id is provided, filter by it
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query.limit(1).single();

    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Fetch Permanent Details Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Map city code to city name
 */
export const getCityNameByCode = (cityCode) => {
  const cityCodeMap = {
    'ALG': 'ALIGARH',
    'DRO': 'DEORIA',
    'BLY': 'BALLIA',
    'GZP': 'GHAZIPUR',
    'MAU': 'MAU',
    'AZM': 'AZAMGARH',
    'JNP': 'JAUNPUR',
    'VNS': 'VARANASI',
    'GKP': 'GORAKHPUR',
    'BST': 'BASTI',
    'KSN': 'KUSHINAGAR',
    'SKP': 'SITAPUR',
    // Add more city codes as needed
  };
  return cityCodeMap[cityCode?.toUpperCase()] || cityCode || 'ALIGARH';
};

/**
 * Load all data required for PDF generation
 */
export const loadAllPdfData = async (biltyData) => {
  try {
    // Fetch all data in parallel
    const [permanentRes, fromCityRes, toCityRes, branchRes, transportRes] = await Promise.all([
      fetchPermanentDetails(biltyData.branch_id),
      fetchCityById(biltyData.from_city_id),
      fetchCityById(biltyData.to_city_id),
      fetchBranchById(biltyData.branch_id),
      fetchTransportByName(biltyData.transport_name),
    ]);

    // Handle from city - if not found, try to get from branch
    let fromCity = fromCityRes.data;
    if (!fromCity && branchRes.data?.city_code) {
      fromCity = {
        city_name: getCityNameByCode(branchRes.data.city_code),
        city_code: branchRes.data.city_code,
      };
    }

    return {
      success: true,
      data: {
        bilty: biltyData,
        permanentDetails: permanentRes.data,
        fromCity: fromCity,
        toCity: toCityRes.data,
        branch: branchRes.data,
        transport: transportRes.data,
      }
    };
  } catch (error) {
    console.error('Load All PDF Data Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load complete bilty data by GR number (combines bilty fetch + all related data)
 */
export const loadBiltyForPrinting = async (grNo) => {
  try {
    // First fetch the bilty
    const biltyResult = await fetchBiltyByGR(grNo);
    if (!biltyResult.success || !biltyResult.data) {
      return { success: false, error: 'Bilty not found' };
    }

    // Then load all related data
    const allDataResult = await loadAllPdfData(biltyResult.data);
    if (!allDataResult.success) {
      return { success: false, error: allDataResult.error };
    }

    return allDataResult;
  } catch (error) {
    console.error('Load Bilty for Printing Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load complete bilty data by ID (combines bilty fetch + all related data)
 */
export const loadBiltyForPrintingById = async (biltyId) => {
  try {
    // First fetch the bilty
    const biltyResult = await fetchBiltyById(biltyId);
    if (!biltyResult.success || !biltyResult.data) {
      return { success: false, error: 'Bilty not found' };
    }

    // Then load all related data
    const allDataResult = await loadAllPdfData(biltyResult.data);
    if (!allDataResult.success) {
      return { success: false, error: allDataResult.error };
    }

    return allDataResult;
  } catch (error) {
    console.error('Load Bilty for Printing by ID Error:', error);
    return { success: false, error: error.message };
  }
};
