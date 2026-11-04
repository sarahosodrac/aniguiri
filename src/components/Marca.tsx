import { Image, StyleSheet, View } from 'react-native';

export function Marca() {
  return (
    <View style={styles.marca}>
      <Image
        source={require('../../assets/images/logo-texto.png')}
        style={styles.texto}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/images/mascote.png')}
        style={styles.mascote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  marca: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  texto: { width: 150, height: 25 },
  mascote: { width: 52, height: 52 },
});