// index.js - Export all printing utilities
export { default as BiltyPdfGenerator } from './BiltyPdfGenerator';
export { generateBiltyPdfHtml, generateSingleCopyHtml } from './biltyPdfTemplate';
export {
  fetchBiltyByGR,
  fetchBiltyById,
  fetchCityById,
  fetchBranchById,
  fetchTransportByName,
  fetchPermanentDetails,
  loadAllPdfData,
  loadBiltyForPrinting,
  loadBiltyForPrintingById,
  getCityNameByCode,
} from './biltyPdfService';
