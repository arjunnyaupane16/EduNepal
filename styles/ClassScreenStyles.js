import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const H_PADDING = 16; // matches content horizontal padding
const GRID_GAP = 16;  // gap between grid items
const CARD_WIDTH = (width - (H_PADDING * 2) - GRID_GAP) / 2;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },

  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 14,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  searchInput: {
    marginLeft: 10,
    fontSize: 16,
    flex: 1,
    color: '#1e293b',
    fontWeight: '500',
  },

  content: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 28,
  },

  classTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    marginTop: 5,
    color: '#1e293b',
    letterSpacing: -0.5,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: GRID_GAP,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: GRID_GAP,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 22,
  },

  subtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 10,
  },

  arrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#f1f5f9',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recentActivityHeader: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 16,
    color: '#1e293b',
  },
});
