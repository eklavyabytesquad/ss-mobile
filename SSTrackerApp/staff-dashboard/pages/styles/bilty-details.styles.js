import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 48,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 18,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  logoSmall: {
    width: 32,
    height: 24,
    opacity: 0.8,
  },
  grContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateLine: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontWeight: '500',
  },

  // Route card
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: -16,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCity: {
    flex: 1,
    alignItems: 'center',
  },
  routeCityLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 3,
  },
  routeCityName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  routeConnector: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  routeLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
  },
  routeArrow: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },

  // Parties
  partyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    borderLeftWidth: 3,
  },
  partyConsignor: { borderLeftColor: '#3b82f6' },
  partyConsignee: { borderLeftColor: '#8b5cf6' },
  partyTransport: { borderLeftColor: '#10b981' },
  partyType: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },

  // Charges
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  chargeLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  chargeValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },

  // Image section
  imageSection: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  biltyImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#f8fafc',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  imageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 6,
  },
  imageActionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  imageRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    gap: 6,
  },
  imageRemoveText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  uploadBtnRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  uploadOptionBtn: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  uploadOptionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  uploadSection: {
    marginHorizontal: 16,
    marginTop: 14,
  },

  // Kaat Details
  kaatCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  kaatFieldGroup: {
    marginBottom: 14,
  },
  kaatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  kaatInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  selectedTransportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedTransportName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  selectedTransportCity: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 1,
  },
  clearTransportBtn: {
    padding: 4,
    marginLeft: 8,
  },
  toggleAllBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleAllText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  transportDropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  transportSearchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  transportItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transportItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  transportItemCity: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  kaatSaveBtn: {
    backgroundColor: '#475569',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  kaatSaveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Tracking
  trackingCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  trackingLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  trackingValue: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  complaintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  complaintText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  resolvedBadge: {
    backgroundColor: '#f0fdf4',
  },
  resolvedText: {
    color: '#16a34a',
  },
});
