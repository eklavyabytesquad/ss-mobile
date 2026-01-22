// biltyPdfTemplate.js - HTML template generator for bilty PDF
// This creates a professional bilty receipt matching the Next.js version

/**
 * Format date to DD/MM/YYYY
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
};

/**
 * Format delivery type
 */
const formatDeliveryType = (deliveryType) => {
  if (deliveryType === 'door-delivery') return '/ DD';
  if (deliveryType === 'godown-delivery') return '';
  return '';
};

/**
 * Format payment mode
 */
const formatPaymentMode = (paymentMode) => {
  if (!paymentMode) return 'TO PAY';
  switch (paymentMode.toLowerCase()) {
    case 'to-pay': return 'TO PAY';
    case 'paid': return 'PAID';
    case 'to-billed': return 'TO BILLED';
    default: return paymentMode.toUpperCase();
  }
};

/**
 * Generate single copy HTML (either Consignee or Driver copy)
 */
const generateBiltyCopy = (data, copyType) => {
  const { bilty, permanentDetails, fromCity, toCity, branch, transport } = data;
  
  const fromCityName = fromCity?.city_name || 'ALIGARH';
  const toCityName = toCity?.city_name || 'N/A';
  const toCityCode = toCity?.city_code || '';
  
  // Use permanentDetails with correct column names
  const companyName = permanentDetails?.transport_name || 'SS TRANSPORT CORPORATION';
  const companyGst = permanentDetails?.gst || '09COVPS5556J1ZT';
  const companyMobile = permanentDetails?.mobile_number || '7668291228';
  const companyAddress = permanentDetails?.transport_address || 'GANDHI MARKET, G T ROAD, ALIGARH-202001';
  const companyWebsite = permanentDetails?.website || 'www.sstransport.in';
  const bankAccount1 = permanentDetails?.bank_act_no_1 || '';
  const ifscCode1 = permanentDetails?.ifsc_code_1 || '';
  const bankAccount2 = permanentDetails?.bank_act_no_2 || '';
  const ifscCode2 = permanentDetails?.ifsc_code_2 || '';
  
  const deliveryText = transport?.transport_name || bilty.transport_name || 'N/A';
  const mobileNumber = transport?.mob_number || companyMobile;
  const gstinNumber = transport?.gstin || bilty.transport_gst || '';
  
  // Use values directly from bilty table - no calculations
  const amount = bilty.freight_amount || 0;
  const total = bilty.total || 0;

  // Format consignee GST display
  let gstDisplay = bilty.consignee_gst || '';
  if (gstDisplay.startsWith('AD-')) {
    gstDisplay = `Aadhar: ${gstDisplay.replace('AD-', '')}`;
  } else if (gstDisplay.toLowerCase().startsWith('pan')) {
    gstDisplay = `PAN: ${gstDisplay.replace(/pan[-:]?/i, '')}`;
  } else if (gstDisplay) {
    gstDisplay = `GST: ${gstDisplay}`;
  }

  return `
    <div class="bilty-copy">
      <!-- Header Section -->
      <div class="header">
        <div class="header-left">
          <p class="gst-label"><strong>GST NO:</strong> ${companyGst}</p>
          ${bankAccount1 ? `<p class="bank-details"><strong>A/C 1:</strong> ${bankAccount1}</p>` : ''}
          ${ifscCode1 ? `<p class="bank-details"><strong>IFSC:</strong> ${ifscCode1}</p>` : ''}
          ${bankAccount2 ? `<p class="bank-details"><strong>A/C 2:</strong> ${bankAccount2}</p>` : ''}
          ${ifscCode2 ? `<p class="bank-details"><strong>IFSC:</strong> ${ifscCode2}</p>` : ''}
        </div>
        <div class="header-center">
          <h1 class="company-name">${companyName}</h1>
          <p class="copy-type">${copyType}</p>
          <p class="gr-box">GR NO: <strong>${bilty.gr_no}</strong></p>
        </div>
        <div class="header-right">
          <p class="address">${companyAddress?.split('\n')[0] || ''}</p>
          <p class="address">${companyAddress?.split('\n')[1] || ''}</p>
          <p class="address"><strong>MOB:</strong> ${companyMobile}</p>
        </div>
      </div>

      <!-- Route and Date Section -->
      <div class="route-section">
        <div class="route-left">
          <p><strong>DATE:</strong> ${formatDate(bilty.bilty_date)}</p>
          <p class="route"><strong>FROM:</strong> ${fromCityName} <strong>TO:</strong> ${toCityName}</p>
        </div>
        <div class="route-right">
          <p class="delivery-at"><strong>DELIVERY AT:</strong> ${deliveryText} ${formatDeliveryType(bilty.delivery_type)}</p>
          <p><strong>GSTIN:</strong> ${gstinNumber}</p>
          <p><strong>MOB:</strong> ${mobileNumber}</p>
        </div>
      </div>

      <!-- Consignor / Consignee Section -->
      <div class="parties-section">
        <div class="party-row">
          <div class="consignor">
            <p><strong>CONSIGNOR:</strong> ${bilty.consignor_name || 'N/A'}</p>
            <p>GST: ${bilty.consignor_gst || 'N/A'} | MOB: ${bilty.consignor_number || 'N/A'}</p>
          </div>
          <div class="consignee">
            <p><strong>CONSIGNEE:</strong> ${bilty.consignee_name || 'N/A'}</p>
            <p>${gstDisplay || 'N/A'} | MOB: ${bilty.consignee_number || 'N/A'}</p>
          </div>
        </div>
        <p class="eway-bill"><strong>E-WAY BILL:</strong> ${bilty.e_way_bill || 'N/A'}</p>
      </div>

      <!-- Main Content Table -->
      <div class="main-table">
        <div class="table-left">
          <table class="invoice-details">
            <tr><td><strong>INVOICE DATE:</strong></td><td>${formatDate(bilty.invoice_date)}</td></tr>
            <tr><td><strong>INVOICE NO:</strong></td><td>${bilty.invoice_no || 'N/A'}</td></tr>
            <tr><td><strong>INVOICE VALUE:</strong></td><td>₹${bilty.invoice_value || 0}</td></tr>
            <tr><td><strong>CONTENT:</strong></td><td>${bilty.contain || 'N/A'}</td></tr>
          </table>
        </div>
        <div class="table-center">
          <div class="package-box">
            <div class="package-item">
              <span class="label">PVT MARKS</span>
              <span class="value">${bilty.pvt_marks || 'N/A'}</span>
            </div>
            <div class="package-item">
              <span class="label">CITY CODE</span>
              <span class="value">${toCityCode}</span>
            </div>
          </div>
          <p class="pkg-wt"><strong>PKG:</strong> ${bilty.no_of_pkg || 0} | <strong>WT:</strong> ${bilty.wt || 0} KG</p>
        </div>
        <div class="table-right">
          <table class="charges-table">
            <tr><td>AMOUNT:</td><td class="amount">₹${amount}</td></tr>
            <tr><td>LABOUR CHARGE:</td><td class="amount">₹${bilty.labour_charge || 0}</td></tr>
            <tr><td>BILTY CHARGE:</td><td class="amount">₹${bilty.bill_charge || 0}</td></tr>
            <tr><td>TOLL TAX:</td><td class="amount">₹${bilty.toll_charge || 0}</td></tr>
            <tr><td>PF:</td><td class="amount">₹${bilty.pf_charge || 0}</td></tr>
            <tr><td>DD CHARGE:</td><td class="amount">₹${bilty.dd_charge || 0}</td></tr>
            <tr><td>OTHER:</td><td class="amount">₹${bilty.other_charge || 0}</td></tr>
            <tr class="total-row"><td><strong>TOTAL:</strong></td><td class="amount"><strong>₹${total}</strong></td></tr>
          </table>
          <p class="payment-status ${bilty.payment_mode === 'paid' ? 'paid' : 'to-pay'}">${formatPaymentMode(bilty.payment_mode)}</p>
        </div>
      </div>

      <!-- Caution Box -->
      <div class="caution-box">
        <p class="caution-title">⚠️ CAUTION</p>
        <p class="caution-text">We are not responsible for any damage, leakage, theft, fire, wrong delivery, delay in transit, or any other loss.</p>
      </div>

      <!-- Footer Section -->
      <div class="footer">
        <div class="footer-left">
          <p class="website">${companyWebsite}</p>
          <p class="notice"><strong>NOTICE:</strong> Subject to Aligarh Jurisdiction. Owner's risk. Insurance recommended.</p>
        </div>
        <div class="footer-center">
          <p class="customer-care"><strong>CUSTOMER CARE:</strong> ${companyMobile}</p>
        </div>
        <div class="footer-right">
          <p class="signature">____________________</p>
          <p class="signature-label">Authorised Signatory</p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Generate complete HTML for PDF with both copies
 */
export const generateBiltyPdfHtml = (data) => {
  const consigneeCopy = generateBiltyCopy(data, 'CONSIGNEE COPY');
  const driverCopy = generateBiltyCopy(data, 'DRIVER COPY');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bilty - ${data.bilty.gr_no}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 10px;
          line-height: 1.3;
          color: #000;
          background: #fff;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 5mm;
          margin: 0 auto;
        }
        
        .bilty-copy {
          border: 2px solid #000;
          padding: 8px;
          margin-bottom: 8px;
          page-break-inside: avoid;
        }
        
        .separator {
          border-top: 2px dashed #000;
          margin: 10px 0;
          position: relative;
        }
        
        .separator::after {
          content: '✂ CUT HERE';
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          padding: 0 10px;
          font-size: 9px;
          color: #666;
        }
        
        /* Header Styles */
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        
        .header-left, .header-right {
          width: 25%;
          font-size: 8px;
        }
        
        .header-center {
          width: 50%;
          text-align: center;
        }
        
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
          color: #000;
          text-transform: uppercase;
        }
        
        .copy-type {
          font-size: 12px;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 5px;
        }
        
        .gr-box {
          display: inline-block;
          border: 2px solid #000;
          padding: 3px 15px;
          font-size: 14px;
          background: #fff;
        }
        
        .gst-label {
          font-size: 9px;
          margin-bottom: 3px;
        }
        
        .bank-details {
          font-size: 8px;
          margin-bottom: 2px;
        }
        
        .address {
          font-size: 8px;
          text-align: right;
          margin-bottom: 2px;
        }
        
        /* Route Section */
        .route-section {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        
        .route-left, .route-right {
          width: 50%;
        }
        
        .route-right {
          text-align: right;
        }
        
        .route {
          font-size: 11px;
          font-weight: bold;
        }
        
        .delivery-at {
          font-size: 10px;
        }
        
        /* Parties Section */
        .parties-section {
          border-bottom: 1px solid #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        
        .party-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .consignor, .consignee {
          width: 48%;
        }
        
        .eway-bill {
          font-size: 10px;
        }
        
        /* Main Table */
        .main-table {
          display: flex;
          justify-content: space-between;
          border: 1px solid #000;
          min-height: 100px;
        }
        
        .table-left {
          width: 30%;
          padding: 5px;
          border-right: 1px solid #000;
        }
        
        .table-center {
          width: 30%;
          padding: 5px;
          border-right: 1px solid #000;
        }
        
        .table-right {
          width: 40%;
          padding: 5px;
        }
        
        .invoice-details {
          width: 100%;
          font-size: 9px;
        }
        
        .invoice-details td {
          padding: 2px 0;
        }
        
        .package-box {
          display: flex;
          border: 1px solid #000;
          margin-bottom: 5px;
        }
        
        .package-item {
          flex: 1;
          text-align: center;
          padding: 3px;
        }
        
        .package-item:first-child {
          border-right: 1px solid #000;
        }
        
        .package-item .label {
          display: block;
          font-size: 7px;
          font-weight: bold;
        }
        
        .package-item .value {
          display: block;
          font-size: 11px;
          font-weight: bold;
        }
        
        .pkg-wt {
          font-size: 9px;
          margin-top: 5px;
        }
        
        .charges-table {
          width: 100%;
          font-size: 9px;
        }
        
        .charges-table td {
          padding: 1px 0;
        }
        
        .charges-table .amount {
          text-align: right;
          font-weight: bold;
        }
        
        .total-row {
          border-top: 1px solid #000;
          font-size: 11px;
        }
        
        .payment-status {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          padding: 5px;
          margin-top: 5px;
          border: 2px solid #000;
          background: #fff;
          color: #000;
        }
        
        .payment-status.paid {
          background: #fff;
          color: #000;
        }
        
        .payment-status.to-pay {
          background: #fff;
          color: #000;
        }
        
        /* Caution Box */
        .caution-box {
          border: 1px solid #000;
          padding: 5px;
          margin: 8px 0;
          background: #fff;
        }
        
        .caution-title {
          font-weight: bold;
          font-size: 9px;
          margin-bottom: 3px;
        }
        
        .caution-text {
          font-size: 8px;
          line-height: 1.2;
        }
        
        /* Footer */
        .footer {
          display: flex;
          justify-content: space-between;
          padding-top: 5px;
          border-top: 1px solid #000;
        }
        
        .footer-left, .footer-center, .footer-right {
          width: 33%;
        }
        
        .footer-center {
          text-align: center;
        }
        
        .footer-right {
          text-align: right;
        }
        
        .website {
          font-size: 9px;
          font-weight: bold;
        }
        
        .notice {
          font-size: 7px;
          margin-top: 3px;
        }
        
        .customer-care {
          font-size: 10px;
        }
        
        .signature {
          margin-top: 15px;
          font-size: 10px;
        }
        
        .signature-label {
          font-size: 8px;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page {
            page-break-after: always;
          }
          
          .separator {
            page-break-before: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${consigneeCopy}
        <div class="separator"></div>
        ${driverCopy}
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate single copy HTML (for quick print)
 */
export const generateSingleCopyHtml = (data, copyType = 'CONSIGNEE COPY') => {
  const copy = generateBiltyCopy(data, copyType);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bilty - ${data.bilty.gr_no}</title>
      <style>
        /* Black and white styles for single copy */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', Times, serif; font-size: 10px; line-height: 1.3; color: #000; background: #fff; }
        .page { width: 210mm; padding: 10mm; margin: 0 auto; }
        .bilty-copy { border: 2px solid #000; padding: 10px; }
        .header { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
        .header-left, .header-right { width: 25%; font-size: 8px; }
        .header-center { width: 50%; text-align: center; }
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
        .copy-type { font-size: 12px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
        .gr-box { display: inline-block; border: 2px solid #000; padding: 3px 15px; font-size: 14px; background: #fff; }
        .gst-label { font-size: 9px; margin-bottom: 3px; }
        .bank-details { font-size: 8px; margin-bottom: 2px; }
        .address { font-size: 8px; text-align: right; margin-bottom: 2px; }
        .route-section { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 6px; }
        .route-left, .route-right { width: 50%; }
        .route-right { text-align: right; }
        .route { font-size: 11px; font-weight: bold; }
        .delivery-at { font-size: 10px; }
        .parties-section { border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 6px; }
        .party-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .consignor, .consignee { width: 48%; }
        .eway-bill { font-size: 10px; }
        .main-table { display: flex; justify-content: space-between; border: 1px solid #000; min-height: 100px; }
        .table-left { width: 30%; padding: 5px; border-right: 1px solid #000; }
        .table-center { width: 30%; padding: 5px; border-right: 1px solid #000; }
        .table-right { width: 40%; padding: 5px; }
        .invoice-details { width: 100%; font-size: 9px; }
        .invoice-details td { padding: 2px 0; }
        .package-box { display: flex; border: 1px solid #000; margin-bottom: 5px; }
        .package-item { flex: 1; text-align: center; padding: 3px; }
        .package-item:first-child { border-right: 1px solid #000; }
        .package-item .label { display: block; font-size: 7px; font-weight: bold; }
        .package-item .value { display: block; font-size: 11px; font-weight: bold; }
        .pkg-wt { font-size: 9px; margin-top: 5px; }
        .charges-table { width: 100%; font-size: 9px; }
        .charges-table td { padding: 1px 0; }
        .charges-table .amount { text-align: right; font-weight: bold; }
        .total-row { border-top: 1px solid #000; font-size: 11px; }
        .payment-status { text-align: center; font-size: 14px; font-weight: bold; padding: 5px; margin-top: 5px; border: 2px solid #000; background: #fff; color: #000; }
        .payment-status.paid { background: #fff; color: #000; }
        .payment-status.to-pay { background: #fff; color: #000; }
        .caution-box { border: 1px solid #000; padding: 5px; margin: 8px 0; background: #fff; }
        .caution-title { font-weight: bold; font-size: 9px; margin-bottom: 3px; }
        .caution-text { font-size: 8px; line-height: 1.2; }
        .footer { display: flex; justify-content: space-between; padding-top: 5px; border-top: 1px solid #000; }
        .footer-left, .footer-center, .footer-right { width: 33%; }
        .footer-center { text-align: center; }
        .footer-right { text-align: right; }
        .website { font-size: 9px; font-weight: bold; }
        .notice { font-size: 7px; margin-top: 3px; }
        .customer-care { font-size: 10px; }
        .signature { margin-top: 15px; font-size: 10px; }
        .signature-label { font-size: 8px; }
      </style>
    </head>
    <body>
      <div class="page">
        ${copy}
      </div>
    </body>
    </html>
  `;
};

export default {
  generateBiltyPdfHtml,
  generateSingleCopyHtml,
};
