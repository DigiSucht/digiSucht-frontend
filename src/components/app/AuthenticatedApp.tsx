import * as React from 'react';
import {
	ComponentType,
	useCallback,
	useContext,
	useEffect,
	useState
} from 'react';
import { Routing } from './Routing';
import { config } from '../../resources/scripts/config';
import { setValueInCookie } from '../sessionCookie/accessSessionCookie';
import {
	UserDataContext,
	NotificationsContext,
	hasUserAuthority,
	AUTHORITIES,
	SessionsDataContext,
	ConsultingTypesContext
} from '../../globalState';
import {
	apiFinishAnonymousConversation,
	apiGetConsultingTypes,
	apiGetUserData
} from '../../api';
import { Loading } from './Loading';
import { handleTokenRefresh } from '../auth/auth';
import { logout } from '../logout/logout';
import { Notifications } from '../notifications/Notifications';
import { LegalInformationLinksProps } from '../login/LegalInformationLinks';
import './authenticatedApp.styles';
import './navigation.styles';
import { requestPermissions } from '../../utils/notificationHelpers';
// import { TwoFactorNag } from '../twoFactorAuth/TwoFactorNag';

interface AuthenticatedAppProps {
	onAppReady: Function;
	onLogout: Function;
	legalComponent: ComponentType<LegalInformationLinksProps>;
	spokenLanguages: string[];
}

export const AuthenticatedApp = ({
	onLogout,
	onAppReady,
	legalComponent,
	spokenLanguages
}: AuthenticatedAppProps) => {
	const { setConsultingTypes } = useContext(ConsultingTypesContext);
	const { userData, setUserData } = useContext(UserDataContext);
	const [appReady, setAppReady] = useState<boolean>(false);
	const [userDataRequested, setUserDataRequested] = useState<boolean>(false);
	const { notifications } = useContext(NotificationsContext);
	const { sessionsData } = useContext(SessionsDataContext);
	const sessionId = sessionsData?.mySessions?.[0]?.session?.id;

	useEffect(() => {
		if (
			userData &&
			hasUserAuthority(AUTHORITIES.CONSULTANT_DEFAULT, userData)
		) {
			requestPermissions();
		}
	}, [userData]);

	useEffect(() => {
		if (!userDataRequested) {
			setUserDataRequested(true);
			handleTokenRefresh().then(() => {
				Promise.all([apiGetUserData(), apiGetConsultingTypes()])
					.then(([userProfileData, consultingTypes]) => {
						// set informal / formal cookie depending on the given userdata
						setValueInCookie(
							'useInformal',
							!userProfileData.formalLanguage ? '1' : ''
						);
						setUserData(userProfileData);
						setConsultingTypes(consultingTypes);
						setAppReady(true);
					})
					.catch((error) => {
						window.location.href = config.urls.toEntry;
						console.log(error);
					});
			});
		}
	}, [userDataRequested, setUserData, setConsultingTypes]);

	useEffect(() => {
		onAppReady();
	}, [appReady]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleLogout = useCallback(() => {
		if (hasUserAuthority(AUTHORITIES.ANONYMOUS_DEFAULT, userData)) {
			apiFinishAnonymousConversation(sessionId).catch((error) => {
				console.error(error);
			});
		}
		onLogout();
		logout();
	}, [onLogout, sessionId, userData]);

	if (appReady) {
		return (
			<>
				<Routing
					logout={handleLogout}
					legalComponent={legalComponent}
					spokenLanguages={spokenLanguages}
				/>
				{notifications && (
					<Notifications notifications={notifications} />
				)}
				{/* <TwoFactorNag /> */}{' '}
				{/* temporarily disabled as per COBH-4265 */}
			</>
		);
	}

	return <Loading />;
};
