import { View, Text, Pressable, Image } from 'react-native';

export function ListScreen({ rows, onPick }) {
  return (
    <View style={{ padding: 13, borderRadius: 6 }}>
      {rows.map((r) => (
        <Pressable key={r.id} onPress={() => onPick(r)} style={{ width: 30, height: 30 }}>
          <Image source={{ uri: r.icon }} />
        </Pressable>
      ))}
      <Text style={{ fontSize: 10 }}>{rows.length} items</Text>
    </View>
  );
}
