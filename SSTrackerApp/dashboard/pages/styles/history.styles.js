import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  shipmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
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
    color: '#1a1a1a',
  },
  shipmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
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
    color: '#999999',
    marginBottom: 2,
  },
  shipmentValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  statusDelivered: {
    backgroundColor: '#d4edda',
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  statusTextDelivered: {
    color: '#155724',
  },
  statusTextCancelled: {
    color: '#721c24',
  },
});
