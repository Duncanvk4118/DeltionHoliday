import {Tabs} from 'expo-router';
import {Ionicons} from "@expo/vector-icons";
import { LocationProvider } from '@/context/LocationContext';
import {SchoolYearProvider} from "@/context/SchoolYearContext";

export default function RootLayout() {

  return (

  <LocationProvider>
      <SchoolYearProvider>
        <Tabs>
            <Tabs.Screen name="index" options={{
                title: 'Overzicht',
                tabBarLabel: 'Overzicht',
                tabBarIcon: ({color, size}) => <Ionicons name={"home"} color={color} size={size}/>
            }} />
            <Tabs.Screen name="countdown" options={{
                title: 'Countdown',
                tabBarLabel: 'Countdown',
                tabBarIcon: ({color, size}) => <Ionicons name={"alarm"} color={color} size={size}/>
            }} />
            <Tabs.Screen name="about" options={{
                title: 'Over mij',
                tabBarLabel: 'Over mij',
                tabBarIcon: ({color, size}) => <Ionicons name={"person"} color={color} size={size}/>
            }} />
        </Tabs>
      </SchoolYearProvider>
  </LocationProvider>

  );
}
