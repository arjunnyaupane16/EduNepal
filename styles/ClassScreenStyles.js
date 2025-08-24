import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const H_PADDING = 16; // matches content horizontal padding
const GRID_GAP = 16;  // gap between grid items
const CARD_WIDTH = (width - (H_PADDING * 2) - GRID_GAP) / 2;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e9f2',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
    zIndex: 10,
  },

  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.6,
  },

  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 13,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e6edf6',
  },

  searchInput: {
    marginLeft: 12,
    fontSize: 15.5,
    flex: 1,
    color: '#0f172a',
    fontWeight: '600',
  },

  content: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 30,
  },

  classTitle: {
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 18,
    marginTop: 6,
    color: '#0f172a',
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
    borderRadius: 20,
    padding: 18,
    marginBottom: GRID_GAP,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#eef2f7',
  },

  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 22,
  },

  subtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },

  arrow: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    backgroundColor: '#eef2f7',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recentActivityHeader: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 16,
    color: '#0f172a',
  },
});
