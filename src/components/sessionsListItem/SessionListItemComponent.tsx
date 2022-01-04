import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getSessionsListItemIcon, LIST_ICONS } from './sessionsListItemHelpers';
import {
	MILLISECONDS_PER_SECOND,
	convertISO8601ToMSSinceEpoch,
	getPrettyDateFromMessageDate,
	prettyPrintTimeDifference
} from '../../utils/dateHelpers';
import {
	typeIsTeamSession,
	getTypeOfLocation,
	getSessionListPathForLocation,
	getChatTypeForListItem,
	typeIsEnquiry,
	getChatItemForSession,
	isGroupChatForSessionItem,
	SESSION_LIST_TYPES
} from '../session/sessionHelpers';
import { translate } from '../../utils/translate';
import {
	SessionsDataContext,
	UserDataContext,
	getSessionsDataKeyForSessionType,
	hasUserAuthority,
	isAnonymousSession,
	AUTHORITIES,
	useConsultingType,
	getActiveSession,
	STATUS_FINISHED,
	STATUS_EMPTY,
	STATUS_ENQUIRY
} from '../../globalState';
import { history } from '../app/app';
import { getGroupChatDate } from '../session/sessionDateHelpers';
import { markdownToDraft } from 'markdown-draft-js';
import { convertFromRaw } from 'draft-js';
import './sessionsListItem.styles';
import { Tag } from '../tag/Tag';
import { SessionListItemVideoCall } from './SessionListItemVideoCall';
import { SessionListItemAttachment } from './SessionListItemAttachment';

interface SessionListItemProps {
	type: SESSION_LIST_TYPES;
	id: number;
	language: string;
}

export const SessionListItemComponent = ({
	id,
	language
}: SessionListItemProps) => {
	const { sessionId, rcGroupId: groupIdFromParam } = useParams();
	const sessionIdFromParam = sessionId ? parseInt(sessionId) : null;

	const sessionListTab = new URLSearchParams(useLocation().search).get(
		'sessionListTab'
	);
	const getSessionListTab = () =>
		`${sessionListTab ? `?sessionListTab=${sessionListTab}` : ''}`;
	const { sessionsData } = useContext(SessionsDataContext);
	const [activeSession, setActiveSession] = useState(null);
	const [isRead, setIsRead] = useState(false);
	const { userData } = useContext(UserDataContext);
	const type = getTypeOfLocation();

	const currentSessionData = sessionsData[
		getSessionsDataKeyForSessionType(type)
	].filter((session) => id === getChatItemForSession(session).id)[0];
	const listItem =
		currentSessionData[getChatTypeForListItem(currentSessionData)];
	const isGroupChat = isGroupChatForSessionItem(currentSessionData);
	const isLiveChat = isAnonymousSession(currentSessionData?.session);
	const isLiveChatFinished = listItem.status === STATUS_FINISHED;
	let plainTextLastMessage = '';
	const consultingType = useConsultingType(listItem.consultingType);
	const sessionConsultingType = useConsultingType(
		currentSessionData.session?.consultingType
	);

	useEffect(() => {
		const activeSession = getActiveSession(groupIdFromParam, sessionsData);
		const chatItem = getChatItemForSession(activeSession);

		setActiveSession(activeSession);
		setIsRead(chatItem?.id === listItem.id || listItem.messagesRead);
	}, [groupIdFromParam, listItem.id, listItem.messagesRead, sessionsData]);

	if (listItem.lastMessage) {
		const rawMessageObject = markdownToDraft(listItem.lastMessage);
		const contentStateMessage = convertFromRaw(rawMessageObject);
		plainTextLastMessage = contentStateMessage.getPlainText();
	}

	const isCurrentSessionNewEnquiry =
		currentSessionData.session &&
		currentSessionData.session.status === STATUS_EMPTY;

	const isCurrentSessionFirstContactMessage =
		currentSessionData.session &&
		currentSessionData.session.status === STATUS_ENQUIRY;

	if (!sessionsData) {
		return null;
	}

	if (!currentSessionData) {
		return null;
	}

	const handleOnClick = () => {
		if (listItem.groupId && listItem.id) {
			history.push(
				`${getSessionListPathForLocation()}/${listItem.groupId}/${
					listItem.id
				}${getSessionListTab()}`
			);
		} else if (
			hasUserAuthority(AUTHORITIES.ASKER_DEFAULT, userData) &&
			isCurrentSessionNewEnquiry
		) {
			history.push(`/sessions/user/view/write/${listItem.id}`);
		}
	};

	const iconVariant = () => {
		if (isGroupChat) {
			return LIST_ICONS.IS_GROUP_CHAT;
		} else if (isLiveChat) {
			return LIST_ICONS.IS_LIVE_CHAT;
		} else if (isCurrentSessionNewEnquiry) {
			return LIST_ICONS.IS_NEW_ENQUIRY;
		} else if (isRead) {
			return LIST_ICONS.IS_READ;
		} else {
			return LIST_ICONS.IS_UNREAD;
		}
	};
	const Icon = getSessionsListItemIcon(iconVariant());

	const prettyPrintDate = (
		messageDate: number, // seconds since epoch
		createDate: string, // ISO8601 string
		isLiveChat: boolean
	) => {
		const newestDate = Math.max(
			messageDate * MILLISECONDS_PER_SECOND,
			convertISO8601ToMSSinceEpoch(createDate)
		);

		return isLiveChat
			? prettyPrintTimeDifference(newestDate, Date.now())
			: getPrettyDateFromMessageDate(
					newestDate / MILLISECONDS_PER_SECOND
			  );
	};

	if (sessionConsultingType?.groupChat.isGroupChat) {
		return null;
	}

	if (isGroupChat) {
		const isMyChat = () =>
			currentSessionData.consultant &&
			userData.userId === currentSessionData.consultant.id;
		const defaultSubjectText = isMyChat()
			? translate('groupChat.listItem.subjectEmpty.self')
			: translate('groupChat.listItem.subjectEmpty.other');
		return (
			<div
				onClick={handleOnClick}
				className={
					activeSession && activeSession.chat?.id === listItem.id
						? `sessionsListItem sessionsListItem--active`
						: `sessionsListItem`
				}
				data-group-id={listItem.groupId ? listItem.groupId : ''}
				data-cy="session-list-item"
			>
				<div
					className={
						activeSession && activeSession.chat?.id === listItem.id
							? `sessionsListItem__content sessionsListItem__content--active`
							: `sessionsListItem__content`
					}
				>
					<div className="sessionsListItem__row">
						<div className="sessionsListItem__consultingType">
							{consultingType.titles.default}
						</div>
						<div className="sessionsListItem__date">
							{getGroupChatDate(listItem)}
						</div>
					</div>
					<div className="sessionsListItem__row">
						<div className="sessionsListItem__icon">
							<Icon />
						</div>
						<div
							className={
								isRead
									? `sessionsListItem__username sessionsListItem__username--readLabel`
									: `sessionsListItem__username`
							}
						>
							{listItem.topic}
						</div>
					</div>
					<div className="sessionsListItem__row">
						<div className="sessionsListItem__subject">
							{listItem.lastMessage
								? plainTextLastMessage
								: defaultSubjectText}
						</div>
						{listItem.attachment && (
							<SessionListItemAttachment
								attachment={listItem.attachment}
							/>
						)}
						{listItem.active && (
							<Tag
								text={translate(
									'groupChat.listItem.activeLabel'
								)}
								color="green"
							/>
						)}
					</div>
				</div>
			</div>
		);
	}

	const feedbackPath = `${getSessionListPathForLocation()}/${
		listItem.feedbackGroupId
	}/${listItem.id}${getSessionListTab()}`;
	return (
		<div
			onClick={handleOnClick}
			className={
				(activeSession && activeSession.session?.id === listItem?.id) ||
				sessionIdFromParam === listItem.id
					? `sessionsListItem sessionsListItem--active`
					: `sessionsListItem`
			}
			data-group-id={listItem.groupId}
			data-cy="session-list-item"
		>
			<div className="sessionsListItem__content">
				<div className="sessionsListItem__row">
					{typeIsTeamSession(type) &&
					hasUserAuthority(
						AUTHORITIES.VIEW_ALL_PEER_SESSIONS,
						userData
					) &&
					currentSessionData.consultant ? (
						<div className="sessionsListItem__consultingType">
							{translate('sessionList.user.peer')}:{' '}
							{currentSessionData.consultant.firstName}{' '}
							{currentSessionData.consultant.lastName}
						</div>
					) : (
						<div className="sessionsListItem__consultingType">
							{consultingType.titles.default}{' '}
							{listItem.consultingType !== 1 &&
							!hasUserAuthority(
								AUTHORITIES.ASKER_DEFAULT,
								userData
							) &&
							!isLiveChat
								? '/ ' + listItem.postcode
								: null}
						</div>
					)}
					<div className="sessionsListItem__date">
						{prettyPrintDate(
							listItem.messageDate,
							listItem.createDate,
							isLiveChat
						)}
					</div>
				</div>
				<div className="sessionsListItem__row">
					<div className="sessionsListItem__icon">
						<Icon />
					</div>
					<div
						className={
							isRead
								? `sessionsListItem__username sessionsListItem__username--readLabel`
								: `sessionsListItem__username`
						}
					>
						{hasUserAuthority(
							AUTHORITIES.ASKER_DEFAULT,
							userData
						) ||
						hasUserAuthority(
							AUTHORITIES.ANONYMOUS_DEFAULT,
							userData
						)
							? currentSessionData.consultant
								? currentSessionData.consultant.username
								: isCurrentSessionNewEnquiry
								? translate('sessionList.user.writeEnquiry')
								: translate(
										'sessionList.user.consultantUnknown'
								  )
							: currentSessionData.user.username}
					</div>
				</div>
				<div className="sessionsListItem__row">
					{listItem.lastMessage ? (
						<div className="sessionsListItem__subject">
							{isCurrentSessionFirstContactMessage && language ? (
								<>
									<span>
										{/* we need a &nbsp; here, to ensure correct spacing for long messages */}
										{language.toUpperCase()} |&nbsp;
									</span>
									{plainTextLastMessage}
								</>
							) : (
								plainTextLastMessage
							)}
						</div>
					) : (
						(isCurrentSessionNewEnquiry || isLiveChat) && (
							<span></span>
						)
					)}
					{listItem.attachment && (
						<SessionListItemAttachment
							attachment={listItem.attachment}
						/>
					)}
					{listItem.videoCallMessageDTO && (
						<SessionListItemVideoCall
							videoCallMessage={listItem.videoCallMessageDTO}
							listItemUsername={
								currentSessionData.user?.username ||
								currentSessionData.consultant?.username
							}
							listItemAskerRcId={listItem.askerRcId}
						/>
					)}
					{!hasUserAuthority(AUTHORITIES.ASKER_DEFAULT, userData) &&
						!typeIsEnquiry(type) &&
						!listItem.feedbackRead &&
						!isLiveChat &&
						!(
							activeSession &&
							activeSession.isFeedbackSession &&
							activeSession.session.feedbackGroupId ===
								listItem.feedbackGroupId
						) && (
							<Tag
								color="yellow"
								text={translate('chatFlyout.feedback')}
								link={feedbackPath}
							/>
						)}
					{isLiveChat &&
						!typeIsEnquiry(type) &&
						!isLiveChatFinished && (
							<Tag
								text={translate(
									'anonymous.listItem.activeLabel'
								)}
								color="green"
							/>
						)}
				</div>
			</div>
		</div>
	);
};
