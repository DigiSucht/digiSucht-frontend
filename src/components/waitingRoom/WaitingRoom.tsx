import * as React from 'react';
import { Header } from '../header/Header';
import { Headline } from '../headline/Headline';
import { Text } from '../text/Text';
import './waitingRoom.styles';
import { ReactComponent as WelcomeIllustration } from '../../resources/img/illustrations/willkommen.svg';
import { ReactComponent as WaitingIllustration } from '../../resources/img/illustrations/waiting.svg';
import { translate } from '../../utils/translate';
import { useContext, useEffect, useState } from 'react';
import { endpointPort, tld } from '../../resources/scripts/config';
import {
	AnonymousRegistrationResponse,
	apiPostAnonymousRegistration
} from '../../api';
import { Button, ButtonItem, BUTTON_TYPES } from '../button/Button';
import { decodeUsername } from '../../utils/encryptionHelpers';
import {
	deleteCookieByName,
	getValueFromCookie,
	removeAllCookies,
	setValueInCookie
} from '../sessionCookie/accessSessionCookie';
import {
	Overlay,
	OverlayItem,
	OverlayWrapper,
	OVERLAY_FUNCTIONS
} from '../overlay/Overlay';
import {
	AnonymousConversationFinishedContext,
	AnonymousEnquiryAcceptedContext
} from '../../globalState';
import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter';
import { history } from '../app/app';
import {
	acceptanceOverlayItem,
	rejectionOverlayItem
} from './waitingRoomHelpers';
import { handleTokenRefresh, setTokens } from '../auth/auth';

export interface WaitingRoomProps {
	consultingTypeSlug: string;
	consultingTypeId: number;
	onAnonymousRegistration: Function;
}

export const WaitingRoom = (props: WaitingRoomProps) => {
	const [
		isDataProtectionViewActive,
		setIsDataProtectionViewActive
	] = useState<boolean>(true);
	const [username, setUsername] = useState<string>();
	const [isRequestInProgress, setIsRequestInProgress] = useState(false);
	const [isOverlayActive, setIsOverlayActive] = useState<boolean>(false);
	const [overlayItem, setOverlayItem] = useState<OverlayItem>();
	const {
		anonymousEnquiryAccepted,
		setAnonymousEnquiryAccepted
	} = useContext(AnonymousEnquiryAcceptedContext);
	const {
		anonymousConversationFinished,
		setAnonymousConversationFinished
	} = useContext(AnonymousConversationFinishedContext);
	const registrationUrl = `${tld + endpointPort}/${
		props.consultingTypeSlug
	}/registration`;

	useEffect(() => {
		const registeredUsername = getValueFromCookie('registeredUsername');

		// handle a refresh as registered user and not initialize a new user
		if (registeredUsername && getValueFromCookie('keycloak')) {
			setIsDataProtectionViewActive(false);
			setUsername(registeredUsername);
			handleTokenRefresh();
			props.onAnonymousRegistration();
		}

		document.title = `${translate(
			'anonymous.waitingroom.title.start'
		)} ${capitalizeFirstLetter(props.consultingTypeSlug)}`;
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (anonymousEnquiryAccepted) {
			setOverlayItem(acceptanceOverlayItem);
			setIsOverlayActive(true);
			setAnonymousEnquiryAccepted(false);
		}
	}, [anonymousEnquiryAccepted, setAnonymousEnquiryAccepted]);

	useEffect(() => {
		if (anonymousConversationFinished === 'NEW') {
			setOverlayItem(rejectionOverlayItem);
			setIsOverlayActive(true);
			removeAllCookies();
			setAnonymousConversationFinished(null);
		}
	}, [anonymousConversationFinished, setAnonymousConversationFinished]);

	const getUsernameText = () => {
		return `
		 ${translate('anonymous.waitingroom.username')} 
		 <span class="waitingRoom__username">
		 	${
				username
					? username
					: `<span class="waitingRoom__username--loading">${translate(
							'anonymous.waitingroom.username.loading'
					  )}</span>`
			}
		 </span>
		`;
	};

	const confirmButton: ButtonItem = {
		label: translate('anonymous.waitingroom.dataProtection.button'),
		type: BUTTON_TYPES.PRIMARY
	};

	const handleConfirmButton = () => {
		if (!isRequestInProgress) {
			setIsRequestInProgress(true);
			setIsDataProtectionViewActive(false);
			apiPostAnonymousRegistration(props.consultingTypeId)
				.then((response: AnonymousRegistrationResponse) => {
					const decodedUsername = decodeUsername(response.userName);
					setUsername(decodedUsername);
					setValueInCookie('registeredUsername', decodedUsername);
					setValueInCookie('rc_token', response.rcToken);
					setValueInCookie('rc_uid', response.rcUserId);
					setTokens(
						response.accessToken,
						response.expiresIn,
						response.refreshToken,
						response.refreshExpiresIn
					);
					handleTokenRefresh();
					props.onAnonymousRegistration();
				})
				.catch((err) => {
					console.log(err);
				})
				.finally(() => {
					setIsRequestInProgress(false);
				});
		}
	};

	const handleOverlayAction = (buttonFunction: string) => {
		if (buttonFunction === OVERLAY_FUNCTIONS.REDIRECT) {
			history.push(`/app`);
			deleteCookieByName('registeredUsername');
		} else if (buttonFunction === OVERLAY_FUNCTIONS.REDIRECT_TO_HOME) {
			window.location.href = registrationUrl;
		}
	};

	return (
		<>
			<div className="waitingRoom">
				<Header />
				{isDataProtectionViewActive ? (
					<div className="waitingRoom__contentWrapper">
						<div className="waitingRoom__illustration">
							<WelcomeIllustration />
						</div>
						<div>
							<Headline
								className="waitingRoom__headline"
								semanticLevel="1"
								text={translate(
									'anonymous.waitingroom.dataProtection.headline'
								)}
							/>
							<Headline
								className="waitingRoom__subline"
								semanticLevel="3"
								text={translate(
									'anonymous.waitingroom.dataProtection.subline'
								)}
							/>
							<Text
								type="standard"
								text={translate(
									'anonymous.waitingroom.dataProtection.description'
								)}
							/>
							<Text
								type="standard"
								text={translate(
									'registration.dataProtection.label'
								)}
							/>
							<Button
								className="waitingRoom__confirmButton"
								buttonHandle={handleConfirmButton}
								item={confirmButton}
							/>
						</div>
					</div>
				) : (
					<div className="waitingRoom__contentWrapper">
						<div className="waitingRoom__illustration">
							<WaitingIllustration className="waitingRoom__waitingIllustration" />
						</div>
						<div>
							<Headline
								className="waitingRoom__headline"
								semanticLevel="1"
								text={translate(
									'anonymous.waitingroom.headline'
								)}
							/>
							<Headline
								className="waitingRoom__subline"
								semanticLevel="3"
								text={translate(
									'anonymous.waitingroom.subline'
								)}
							/>
							<div className="waitingRoom__user">
								<Text
									type="standard"
									text={getUsernameText()}
								/>
								<Text
									type="standard"
									text={translate(
										'anonymous.waitingroom.info.accountDeletion'
									)}
								/>
							</div>
							<div className="waitingRoom__redirect">
								<Text
									type="standard"
									text={translate(
										'anonymous.waitingroom.redirect.title'
									)}
								/>
								<Text
									type="standard"
									text={translate(
										'anonymous.waitingroom.redirect.subline'
									)}
								/>
								<div className="waitingRoom__redirectButton">
									<a href={registrationUrl}>
										<Button
											item={{
												label: translate(
													'anonymous.waitingroom.redirect.button'
												),
												type: 'TERTIARY'
											}}
											isLink={true}
										/>
									</a>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
			{isOverlayActive && (
				<OverlayWrapper>
					<Overlay
						item={overlayItem}
						handleOverlay={handleOverlayAction}
					/>
				</OverlayWrapper>
			)}
		</>
	);
};
