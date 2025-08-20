import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    width: '45%',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    marginLeft: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 6,
  },
  button: {
    marginTop: 10,
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 13,
  },
});
