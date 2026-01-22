import { StyleSheet } from 'react-native';
import Colors from '../../../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textWhite,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textWhite,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  shipmentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shipmentId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  shipmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  shipmentBody: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  shipmentInfo: {
    flex: 1,
  },
  shipmentLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  shipmentValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  statusDelivered: {
    backgroundColor: '#dcfce7',
  },
  statusInTransit: {
    backgroundColor: '#dbeafe',
  },
  statusAtHub: {
    backgroundColor: '#fef3c7',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  statusTextDelivered: {
    color: Colors.delivered,
  },
  statusTextInTransit: {
    color: Colors.inTransit,
  },
  statusTextAtHub: {
    color: Colors.atHub,
  },
  statusTextCancelled: {
    color: Colors.delayed,
  },
});
