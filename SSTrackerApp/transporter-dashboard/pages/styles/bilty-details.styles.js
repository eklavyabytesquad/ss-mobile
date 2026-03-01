import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  backIcon: {
    fontSize: 20,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerActionIcon: {
    fontSize: 18,
  },

  // GR Badge in header
  grBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grNoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  biltyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  biltyDateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
  },

  // Content
  content: {
    flex: 1,
  },

  // Route Card
  routeCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#1e40af',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  routeSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routePointContainer: {
    flex: 1,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
  },
  routeSmallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
  routeCityName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  routeCityCode: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  routeConnector: {
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLine: {
    width: 50,
    height: 2.5,
    borderRadius: 2,
  },
  routeArrowText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  // Parties Row
  partiesRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  partyCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  partyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  partyEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  partyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  partyPhone: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 3,
  },
  partyGst: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 18,
  },
  detailIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 20,
  },
  contentsSection: {
    marginTop: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  contentsLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 4,
  },
  contentsValue: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },

  // Image Section
  imageContainer: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  biltyImage: {
    width: '100%',
    height: 280,
    borderRadius: 14,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    zIndex: 1,
  },
  imageLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
  },
  imageActions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  imageActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  imageActionText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },

  // Charges
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  chargeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  chargeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
  },

  // Transport
  transportName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  transportPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  transportGst: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 3,
  },

  // Remark
  remarkText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
});
