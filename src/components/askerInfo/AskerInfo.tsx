import * as React from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useParams, useHistory } from 'react-router-dom';
import { AskerInfoMonitoring } from './AskerInfoMonitoring';
import {
	SESSION_LIST_TAB,
	SESSION_LIST_TYPES
} from '../session/sessionHelpers';
import {
	AUTHORITIES,
	hasUserAuthority,
	SessionTypeContext,
	TenantContext,
	UserDataContext
} from '../../globalState';
import { Loading } from '../app/Loading';
import { ReactComponent as BackIcon } from '../../resources/img/icons/arrow-left.svg';
import { AskerInfoAssign } from './AskerInfoAssign';
import '../profile/profile.styles';
import './askerInfo.styles';
import { ActiveSessionContext } from '../../globalState/provider/ActiveSessionProvider';
import { useSearchParam } from '../../hooks/useSearchParams';
import { useSession } from '../../hooks/useSession';
import { useResponsive } from '../../hooks/useResponsive';
import {
	desktopView,
	mobileListView,
	mobileUserProfileView
} from '../app/navigationHandler';
import { useTranslation } from 'react-i18next';
import { AskerInfoTools } from './AskerInfoTools';
import { ProfileBox } from './ProfileBox';
import { ProfileDataItem } from './ProfileDataItem';
import { apiGetUserDataBySessionId } from '../../api/apiGetUserDataBySessionId';
import { ConsultingSessionDataInterface } from '../../globalState/interfaces/ConsultingSessionDataInterface';
import { PersonIcon } from '../../resources/img/icons';
import { RocketChatUsersOfRoomProvider } from '../../globalState/provider/RocketChatUsersOfRoomProvider';

export const AskerInfo = () => {
	const { t: translate } = useTranslation();
	const { tenant } = useContext(TenantContext);
	const [sessionData, setSessionData] =
		useState<ConsultingSessionDataInterface>(null);
	const { rcGroupId: groupIdFromParam } = useParams<{ rcGroupId: string }>();
	const history = useHistory();

	const { userData } = useContext(UserDataContext);
	const { type, path: listPath } = useContext(SessionTypeContext);

	const { session: activeSession, ready } = useSession(groupIdFromParam);
	const [isPeerChat, setIsPeerChat] = useState(false);

	const sessionListTab = useSearchParam<SESSION_LIST_TAB>('sessionListTab');

	useEffect(() => {
		if (activeSession?.item?.id) {
			apiGetUserDataBySessionId(activeSession.item.id).then(
				setSessionData
			);
		}
	}, [activeSession?.item?.id]);

	useEffect(() => {
		if (!ready) {
			return;
		}

		if (!activeSession) {
			history.push(
				listPath +
					(sessionListTab ? `?sessionListTab=${sessionListTab}` : '')
			);
			return;
		}

		setIsPeerChat(activeSession.item.isPeerChat);
	}, [activeSession, history, listPath, ready, sessionListTab]);

	const { fromL } = useResponsive();
	useEffect(() => {
		if (!fromL) {
			mobileUserProfileView();
			return () => {
				mobileListView();
			};
		}
		desktopView();
	}, [fromL]);

	const isSessionAssignAvailable = useCallback(
		() =>
			!hasUserAuthority(AUTHORITIES.ASKER_DEFAULT, userData) &&
			!activeSession.isLive &&
			!activeSession.isGroup &&
			((type === SESSION_LIST_TYPES.ENQUIRY &&
				hasUserAuthority(
					AUTHORITIES.ASSIGN_CONSULTANT_TO_ENQUIRY,
					userData
				) &&
				isPeerChat) ||
				(type !== SESSION_LIST_TYPES.ENQUIRY &&
					((isPeerChat &&
						hasUserAuthority(
							AUTHORITIES.ASSIGN_CONSULTANT_TO_PEER_SESSION,
							userData
						)) ||
						(!isPeerChat &&
							hasUserAuthority(
								AUTHORITIES.ASSIGN_CONSULTANT_TO_SESSION,
								userData
							))))),
		[activeSession, isPeerChat, type, userData]
	);

	if (!activeSession || !sessionData) {
		return <Loading />;
	}
	const translateKeys = {
		gender: `profile.gender.options.${sessionData?.gender?.toLowerCase()}`,
		counselling: `profile.counsellingRelation.${sessionData?.counsellingRelation?.toLowerCase()}`
	};
	return (
		<ActiveSessionContext.Provider value={{ activeSession }}>
			<RocketChatUsersOfRoomProvider>
				<div className="profile__wrapper">
					<div className="profile__header">
						<div className="profile__header__wrapper">
							<Link
								to={`${listPath}/${
									activeSession.item.groupId
								}/${activeSession.item.id}${
									sessionListTab
										? `?sessionListTab=${sessionListTab}`
										: ''
								}`}
								className="profile__header__backButton"
							>
								<BackIcon
									aria-label={translate('app.back')}
									title={translate('app.back')}
								/>
							</Link>
							<h3 className="profile__header__title profile__header__title--withBackButton">
								{translate('profile.header.title')}
							</h3>
						</div>
						<div className="profile__header__metaInfo">
							<p className="profile__header__username profile__header__username--withBackButton">
								{activeSession.user.username}
							</p>
						</div>
					</div>
					<div className="profile__user">
						<div className="profile__icon">
							<PersonIcon
								className="profile__icon--user"
								title={translate('profile.data.profileIcon')}
								aria-label={translate(
									'profile.data.profileIcon'
								)}
							/>
						</div>
						<h2>{activeSession.user.username}</h2>
					</div>
					<div className="askerInfo__contentContainer">
						<ProfileBox title="profile.profilInformation">
							<ProfileDataItem
								title="profile.age"
								content={`${sessionData?.age}`}
							/>
							<ProfileDataItem
								title="profile.gender.title"
								content={translate(translateKeys.gender)}
							/>
							<ProfileDataItem
								title="profile.status"
								content={translate(translateKeys.counselling)}
							/>
							<ProfileDataItem
								title="profile.postalCode"
								content={sessionData?.postcode}
							/>
						</ProfileBox>

						{tenant?.settings?.featureToolsEnabled &&
							sessionData?.id && (
								<ProfileBox title="profile.tools">
									<AskerInfoTools />
								</ProfileBox>
							)}

						<ProfileBox title="profile.topic">
							{sessionData?.mainTopic && (
								<ProfileDataItem
									title="profile.mainTopic"
									content={sessionData?.mainTopic.name}
								/>
							)}

							{sessionData?.topics?.length > 0 && (
								<ProfileDataItem
									title="profile.selectedTopics"
									content={sessionData?.topics
										.map(({ name }) => name)
										.join(', ')}
								/>
							)}
						</ProfileBox>

						{activeSession.item.monitoring &&
							(type === SESSION_LIST_TYPES.MY_SESSION ||
								type === SESSION_LIST_TYPES.TEAMSESSION) && (
								<ProfileBox title="userProfile.monitoring.title">
									<AskerInfoMonitoring />
								</ProfileBox>
							)}

						{isSessionAssignAvailable() && (
							<ProfileBox title="userProfile.reassign.title">
								<AskerInfoAssign />
							</ProfileBox>
						)}
					</div>
				</div>
			</RocketChatUsersOfRoomProvider>
		</ActiveSessionContext.Provider>
	);
};
