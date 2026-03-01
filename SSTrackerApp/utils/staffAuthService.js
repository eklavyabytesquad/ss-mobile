import supabase from './supabase';
import * as Crypto from 'expo-crypto';

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate session token
const generateSessionToken = async () => {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Send OTP via WhatsApp API
const sendWhatsAppOTP = async (phoneNumber, otp) => {
  try {
    const response = await fetch(
      'https://adminapis.backendprod.com/lms_campaign/api/whatsapp/template/h908xvdkc3/process',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver: phoneNumber,
          values: {
            '1': otp,
          },
        }),
      }
    );
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('WhatsApp OTP Error:', error);
    return { success: false, error: error.message };
  }
};

// Check if staff user exists by mobile number (from user_details table)
export const checkStaffByPhone = async (phoneNumber) => {
  try {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');

    // Query user_details by phone to find the user
    const { data: userDetail, error } = await supabase
      .from('user_details')
      .select('user_id, phone, email, employee_code, department')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!userDetail) {
      // Try with last 10 digits match
      const last10 = cleanPhone.slice(-10);
      const { data: allDetails, error: fetchError } = await supabase
        .from('user_details')
        .select('user_id, phone, email, employee_code, department')
        .not('phone', 'is', null);

      if (fetchError) throw fetchError;

      const matched = allDetails?.find(d =>
        d.phone?.trim().replace(/\s+/g, '').slice(-10) === last10
      );

      if (!matched) {
        return { exists: false };
      }

      // Get the user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, name, post, branch_id, image_url, is_active, is_staff')
        .eq('id', matched.user_id)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        return { exists: false, error: 'User account is inactive or not found' };
      }

      return {
        exists: true,
        staff: {
          ...userData,
          phone: matched.phone,
          email: matched.email,
          employee_code: matched.employee_code,
          department: matched.department,
        },
      };
    }

    // Get the user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, name, post, branch_id, image_url, is_active, is_staff')
      .eq('id', userDetail.user_id)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      return { exists: false, error: 'User account is inactive or not found' };
    }

    return {
      exists: true,
      staff: {
        ...userData,
        phone: userDetail.phone,
        email: userDetail.email,
        employee_code: userDetail.employee_code,
        department: userDetail.department,
      },
    };
  } catch (error) {
    console.error('Check Staff By Phone Error:', error);
    return { exists: false, error: error.message };
  }
};

// Request OTP for Staff User
export const requestStaffOTP = async (mobileNumber, userId) => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Mark previous OTPs as expired
    await supabase
      .from('users_otp_records')
      .update({ is_expired: true })
      .eq('mob_number', mobileNumber)
      .eq('is_expired', false);

    // Insert new OTP record
    const { error: insertError } = await supabase
      .from('users_otp_records')
      .insert({
        user_id: userId,
        mob_number: mobileNumber,
        otp_code: otp,
        purpose: 'login',
        is_verified: false,
        is_expired: false,
        attempt_count: 0,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) throw insertError;

    // Send OTP via WhatsApp
    const whatsappResult = await sendWhatsAppOTP(mobileNumber, otp);

    if (!whatsappResult.success) {
      console.warn('WhatsApp send failed, but OTP created:', otp);
    }

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Request Staff OTP Error:', error);
    return { success: false, error: error.message };
  }
};

// Verify Staff OTP
export const verifyStaffOTP = async (mobileNumber, otpCode, deviceInfo = 'Mobile App') => {
  try {
    // Get the latest non-expired OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from('users_otp_records')
      .select('*')
      .eq('mob_number', mobileNumber)
      .eq('is_expired', false)
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return { success: false, error: 'No valid OTP found. Please request a new one.' };
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase
        .from('users_otp_records')
        .update({ is_expired: true })
        .eq('id', otpRecord.id);
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    // Check attempts
    if (otpRecord.attempt_count >= 3) {
      await supabase
        .from('users_otp_records')
        .update({ is_expired: true })
        .eq('id', otpRecord.id);
      return { success: false, error: 'Too many attempts. Please request a new OTP.' };
    }

    // Increment attempt count
    await supabase
      .from('users_otp_records')
      .update({ attempt_count: otpRecord.attempt_count + 1 })
      .eq('id', otpRecord.id);

    // Verify OTP
    if (otpRecord.otp_code !== otpCode) {
      return { success: false, error: 'Invalid OTP. Please try again.' };
    }

    // Mark OTP as verified
    await supabase
      .from('users_otp_records')
      .update({ is_verified: true })
      .eq('id', otpRecord.id);

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, name, post, branch_id, image_url, is_active, is_staff')
      .eq('id', otpRecord.user_id)
      .single();

    if (userError || !userData) {
      return { success: false, error: 'User not found' };
    }

    // Get user_details for extra info
    const { data: userDetail } = await supabase
      .from('user_details')
      .select('phone, email, employee_code, department, city, state')
      .eq('user_id', userData.id)
      .single();

    // Create session
    const sessionToken = await generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Deactivate previous sessions
    await supabase
      .from('mob_user_sessions')
      .update({ is_active: false, logged_out_at: new Date().toISOString() })
      .eq('user_id', userData.id)
      .eq('is_active', true);

    // Create new session
    const { error: sessionError } = await supabase
      .from('mob_user_sessions')
      .insert({
        user_id: userData.id,
        mob_number: mobileNumber,
        session_token: sessionToken,
        is_active: true,
        expires_at: sessionExpiresAt.toISOString(),
        device_info: deviceInfo,
      });

    if (sessionError) throw sessionError;

    return {
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        post: userData.post,
        branchId: userData.branch_id,
        imageUrl: userData.image_url,
        isStaff: userData.is_staff,
        phone: userDetail?.phone || mobileNumber,
        email: userDetail?.email || '',
        employeeCode: userDetail?.employee_code || '',
        department: userDetail?.department || '',
        city: userDetail?.city || '',
        state: userDetail?.state || '',
        userType: 'staff',
      },
      sessionToken,
    };
  } catch (error) {
    console.error('Verify Staff OTP Error:', error);
    return { success: false, error: error.message };
  }
};

// Validate Staff session
export const validateStaffSession = async (sessionToken) => {
  try {
    const { data: session, error } = await supabase
      .from('mob_user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      return { valid: false };
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      await supabase
        .from('mob_user_sessions')
        .update({ is_active: false })
        .eq('id', session.id);
      return { valid: false };
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, name, post, branch_id, image_url, is_active, is_staff')
      .eq('id', session.user_id)
      .eq('is_active', true)
      .single();

    if (userError || !userData) {
      return { valid: false };
    }

    // Get user_details
    const { data: userDetail } = await supabase
      .from('user_details')
      .select('phone, email, employee_code, department, city, state')
      .eq('user_id', userData.id)
      .single();

    return {
      valid: true,
      user: {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        post: userData.post,
        branchId: userData.branch_id,
        imageUrl: userData.image_url,
        isStaff: userData.is_staff,
        phone: userDetail?.phone || session.mob_number,
        email: userDetail?.email || '',
        employeeCode: userDetail?.employee_code || '',
        department: userDetail?.department || '',
        city: userDetail?.city || '',
        state: userDetail?.state || '',
        userType: 'staff',
      },
    };
  } catch (error) {
    console.error('Validate Staff Session Error:', error);
    return { valid: false };
  }
};

// Logout Staff
export const logoutStaff = async (sessionToken) => {
  try {
    await supabase
      .from('mob_user_sessions')
      .update({ is_active: false, logged_out_at: new Date().toISOString() })
      .eq('session_token', sessionToken);
    return { success: true };
  } catch (error) {
    console.error('Staff Logout Error:', error);
    return { success: false, error: error.message };
  }
};
