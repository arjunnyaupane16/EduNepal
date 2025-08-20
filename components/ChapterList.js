import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ChapterList({ chapters, onChapterPress }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Chapters</Text>
      {chapters.map((chapter) => (
        <TouchableOpacity
          key={chapter.id}
          onPress={() => onChapterPress(chapter.page)}
          style={styles.chapterItem}
        >
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chapterItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  chapterTitle: {
    fontSize: 14,
  },
});
