import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EmergencyDashboardScreen from '../screens/EmergencyDashboardScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import MedsScreen from '../screens/MedsScreen';
import RiskAssessmentScreen from '../screens/RiskAssessmentScreen';
import NetworkDashboardScreen from '../screens/NetworkDashboardScreen';
import OfflineRecordsScreen from '../screens/OfflineRecordsScreen';
import AnalyticsDashboardScreen from '../screens/AnalyticsDashboardScreen';
import DocumentViewerScreen from '../screens/DocumentViewerScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AIInsightsScreen from '../screens/AIInsightsScreen';
import NFCAccessScreen from '../screens/NFCAccessScreen';
import PrivacyControlCenterScreen from '../screens/PrivacyControlCenterScreen';

export type RootStackParamList = {
    Landing: undefined;
    Login: undefined;
    Signup: undefined;
    Dashboard: undefined;
    EmergencyDashboard: undefined;
    QRScanner: undefined;
    MedsAndAllergies: undefined;
    RiskAssessment: undefined;
    NetworkDashboard: undefined;
    OfflineRecords: undefined;
    Analytics: undefined;
    AIInsights: { patientId?: string } | undefined;
    NFCAccess: undefined;
    PrivacyControl: undefined;
    DocumentViewer: { url: string, title: string };
    Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Landing"
                screenOptions={{
                    headerStyle: { backgroundColor: '#0a0a1a' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Clinical Sentinel' }} />
                <Stack.Screen name="EmergencyDashboard" component={EmergencyDashboardScreen} options={{ title: '🚨 Emergency View' }} />
                <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: '📷 Scan ID' }} />
                <Stack.Screen name="MedsAndAllergies" component={MedsScreen} options={{ title: '💊 Meds & Allergies' }} />
                <Stack.Screen name="RiskAssessment" component={RiskAssessmentScreen} options={{ title: '🔍 Risk Assessment' }} />
                <Stack.Screen name="NetworkDashboard" component={NetworkDashboardScreen} options={{ title: '🏥 Network' }} />
                <Stack.Screen name="PrivacyControl" component={PrivacyControlCenterScreen} options={{ title: '🛡️ Privacy Control' }} />
                <Stack.Screen name="OfflineRecords" component={OfflineRecordsScreen} options={{ title: '📱 Offline Records' }} />
                <Stack.Screen name="Analytics" component={AnalyticsDashboardScreen} options={{ title: '📊 Analytics' }} />
                <Stack.Screen name="AIInsights" component={AIInsightsScreen} options={{ title: '🧠 AI Insights' }} />
                <Stack.Screen name="NFCAccess" component={NFCAccessScreen} options={{ title: '📡 NFC Emergency Access' }} />
                <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} options={{ title: '📄 Document Viewer' }} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: '📬 Notifications' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
