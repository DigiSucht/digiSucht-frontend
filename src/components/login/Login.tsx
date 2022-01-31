import '../../polyfill';
import * as React from 'react';
import { generatePath } from 'react-router-dom';
import { translate } from '../../utils/translate';
import { InputField, InputFieldItem } from '../inputField/InputField';
import {
	ComponentType,
	useState,
	useEffect,
	useCallback,
	useMemo,
	useContext
} from 'react';
import { config } from '../../resources/scripts/config';
import { ButtonItem, Button, BUTTON_TYPES } from '../button/Button';
import { autoLogin, redirectToApp } from '../registration/autoLogin';
import { Text } from '../text/Text';
import { ReactComponent as PersonIcon } from '../../resources/img/icons/person.svg';
import { ReactComponent as LockIcon } from '../../resources/img/icons/lock.svg';
import { ReactComponent as VerifiedIcon } from '../../resources/img/icons/verified.svg';
import { StageProps } from '../stage/stage';
import { StageLayout } from '../stageLayout/StageLayout';
import {
	apiGetUserData,
	apiRegistrationNewConsultingTypes,
	FETCH_ERRORS
} from '../../api';
import { OTP_LENGTH } from '../profile/TwoFactorAuth';
import clsx from 'clsx';
import '../../resources/styles/styles';
import './login.styles';
import { LegalInformationLinksProps } from './LegalInformationLinks';
import useIsFirstVisit from '../../utils/useIsFirstVisit';
import { getUrlParameter } from '../../utils/getUrlParameter';
import useUrlParamsLoader from '../../utils/useUrlParamsLoader';
import {
	ConsultingTypeAgencySelection,
	useConsultingTypeAgencySelection
} from '../consultingTypeSelection/ConsultingTypeAgencySelection';
import {
	Overlay,
	OVERLAY_FUNCTIONS,
	OverlayItem,
	OverlayWrapper
} from '../overlay/Overlay';
import { ReactComponent as WelcomeIcon } from '../../resources/img/illustrations/willkommen.svg';
import {
	VALIDITY_INITIAL,
	VALIDITY_VALID
} from '../registration/registrationHelpers';
import {
	AcceptedGroupIdContext,
	AUTHORITIES,
	hasUserAuthority,
	UserDataInterface
} from '../../globalState';
import { history } from '../app/app';

const loginButton: ButtonItem = {
	label: translate('login.button.label'),
	type: BUTTON_TYPES.PRIMARY
};

interface LoginProps {
	legalComponent: ComponentType<LegalInformationLinksProps>;
	stageComponent: ComponentType<StageProps>;
}

export const Login = ({
	legalComponent,
	stageComponent: Stage
}: LoginProps) => {
	const consultantId = getUrlParameter('cid');
	const {
		agency: preselectedAgency,
		consultingType,
		consultant,
		loaded: isReady
	} = useUrlParamsLoader();

	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(
		username.length > 0 && password.length > 0
	);
	const [otp, setOtp] = useState<string>('');
	const [isOtpRequired, setIsOtpRequired] = useState<boolean>(false);
	const [showLoginError, setShowLoginError] = useState<string>('');
	const [isRequestInProgress, setIsRequestInProgress] =
		useState<boolean>(false);

	const { setAcceptedGroupId } = useContext(AcceptedGroupIdContext);

	useEffect(() => {
		setShowLoginError('');
		if (
			(!isOtpRequired && username && password) ||
			(isOtpRequired && username && password && otp)
		) {
			setIsButtonDisabled(false);
		} else {
			setIsButtonDisabled(true);
		}
	}, [username, password, otp, isOtpRequired]);

	useEffect(() => {
		setOtp('');
		setIsOtpRequired(false);
	}, [username]);

	const [agency, setAgency] = useState(null);
	const [registerOverlayActive, setRegisterOverlayActive] = useState(false);
	const [validity, setValidity] = useState(VALIDITY_INITIAL);

	const inputItemUsername: InputFieldItem = {
		name: 'username',
		class: 'login',
		id: 'username',
		type: 'text',
		label: translate('login.user.label'),
		content: username,
		icon: <PersonIcon />
	};

	const inputItemPassword: InputFieldItem = {
		name: 'password',
		id: 'passwordInput',
		type: 'password',
		label: translate('login.password.label'),
		content: password,
		icon: <LockIcon />
	};

	const otpInputItem: InputFieldItem = {
		content: otp,
		id: 'otp',
		infoText: translate('login.warning.failed.otp.missing'),
		label: translate('twoFactorAuth.activate.step3.input.label'),
		name: 'otp',
		type: 'text',
		icon: <VerifiedIcon />,
		maxLength: OTP_LENGTH
	};

	const handleUsernameChange = (event) => {
		setUsername(event.target.value);
	};

	const handlePasswordChange = (event) => {
		setPassword(event.target.value);
	};

	const handleOtpChange = (event) => {
		setOtp(event.target.value);
	};

	const {
		agencies: possibleAgencies,
		consultingTypes: possibleConsultingTypes
	} = useConsultingTypeAgencySelection(
		consultant,
		consultingType,
		preselectedAgency
	);

	const registerOverlay = useMemo(
		(): OverlayItem => ({
			svg: WelcomeIcon,
			headline: translate('login.consultant.overlay.success.headline'),
			nestedComponent: (
				<ConsultingTypeAgencySelection
					consultant={consultant}
					agency={agency}
					preselectedConsultingType={consultingType}
					preselectedAgency={preselectedAgency}
					onChange={setAgency}
					onValidityChange={(validity) => setValidity(validity)}
				/>
			),
			buttonSet: [
				{
					label: translate('login.consultant.overlay.cancel.button'),
					function: OVERLAY_FUNCTIONS.CLOSE,
					type: BUTTON_TYPES.SECONDARY
				},
				{
					label: translate('login.consultant.overlay.success.button'),
					function: OVERLAY_FUNCTIONS.REDIRECT_WITH_BLUR,
					type: BUTTON_TYPES.PRIMARY,
					disabled: validity !== VALIDITY_VALID
				}
			]
		}),
		[agency, consultant, consultingType, preselectedAgency, validity]
	);

	const handleRegistration = useCallback(
		(agency) => {
			if (validity === VALIDITY_VALID) {
				apiRegistrationNewConsultingTypes(
					agency.consultingTypeRel.id,
					agency.id,
					agency.postcode,
					consultantId
				)
					.catch((response) => response.json())
					.then((response) => {
						if (response instanceof Error) {
							return redirectToApp();
						}

						if (response.rcGroupId) {
							setAcceptedGroupId(response.rcGroupId);
						} else if (response.sessionId) {
							setAcceptedGroupId(response.sessionId);
						}

						if (!response.rcGroupId || !response.sessionId) {
							history.push(config.endpoints.userSessionsListView);
							return;
						}

						history.push(
							generatePath(
								`${config.endpoints.userSessionsListView}/:rcGroupId/:sessionId`,
								response
							)
						);
					});
			}
		},
		[consultantId, setAcceptedGroupId, validity]
	);

	const handleOverlayAction = useCallback(
		(buttonFunction: string) => {
			if (buttonFunction === OVERLAY_FUNCTIONS.REDIRECT_WITH_BLUR) {
				handleRegistration(agency);
			} else if (buttonFunction === OVERLAY_FUNCTIONS.CLOSE) {
				redirectToApp();
			}
		},
		[agency, handleRegistration]
	);

	useEffect(() => {
		if (
			possibleAgencies.length === 1 &&
			possibleConsultingTypes.length === 1
		) {
			setAgency(possibleAgencies[0]);
			setValidity(VALIDITY_VALID);
		}
	}, [possibleAgencies, possibleConsultingTypes]);

	const postLogin = useCallback(
		(data) => {
			if (!consultant) {
				return redirectToApp();
			}

			return apiGetUserData().then((userData: UserDataInterface) => {
				if (!hasUserAuthority(AUTHORITIES.ASKER_DEFAULT, userData)) {
					return redirectToApp();
				}

				if (
					possibleAgencies.length === 1 &&
					possibleConsultingTypes.length === 1
				) {
					handleRegistration(possibleAgencies[0]);
				} else {
					setRegisterOverlayActive(true);
				}
			});
		},
		[
			consultant,
			possibleAgencies,
			possibleConsultingTypes,
			handleRegistration
		]
	);

	const handleLogin = () => {
		if (!isRequestInProgress && !isOtpRequired && username && password) {
			setIsRequestInProgress(true);
			autoLogin({
				username: username,
				password: password,
				redirect: !consultant
			})
				.then(postLogin)
				.catch((error) => {
					if (error.message === FETCH_ERRORS.UNAUTHORIZED) {
						setShowLoginError(
							translate('login.warning.failed.unauthorized')
						);
					} else if (error.message === FETCH_ERRORS.BAD_REQUEST) {
						setIsOtpRequired(true);
					}
				})
				.finally(() => {
					setIsRequestInProgress(false);
				});
		} else if (
			!isRequestInProgress &&
			isOtpRequired &&
			username &&
			password &&
			otp
		) {
			setIsRequestInProgress(true);
			autoLogin({
				username,
				password,
				redirect: !consultant,
				otp
			})
				.then(postLogin)
				.catch((error) => {
					if (error.message === FETCH_ERRORS.UNAUTHORIZED) {
						setShowLoginError(
							translate('login.warning.failed.unauthorized.otp')
						);
					}
				})
				.finally(() => {
					setIsRequestInProgress(false);
				});
		}
	};

	const handleKeyUp = (e) => {
		if (e.key === 'Enter') {
			handleLogin();
		}
	};

	const isFirstVisit = useIsFirstVisit();

	return (
		<StageLayout
			legalComponent={legalComponent}
			stage={<Stage hasAnimation={isFirstVisit} isReady={isReady} />}
			showLegalLinks
		>
			<div className="loginForm">
				<div className="loginForm__headline">
					<h1>{translate('login.headline')}</h1>
				</div>
				<InputField
					item={inputItemUsername}
					inputHandle={handleUsernameChange}
					keyUpHandle={handleKeyUp}
				/>
				<InputField
					item={inputItemPassword}
					inputHandle={handlePasswordChange}
					keyUpHandle={handleKeyUp}
				/>
				<div
					className={clsx('loginForm__otp', {
						'loginForm__otp--active': isOtpRequired
					})}
				>
					<InputField
						item={otpInputItem}
						inputHandle={handleOtpChange}
						keyUpHandle={handleKeyUp}
					/>
				</div>
				{showLoginError && (
					<Text
						text={showLoginError}
						type="infoSmall"
						className="loginForm__error"
					/>
				)}
				<a
					href={config.endpoints.loginResetPasswordLink}
					target="_blank"
					rel="noreferrer"
					className="loginForm__passwordReset"
				>
					{translate('login.resetPasswort.label')}
				</a>

				<Button
					item={loginButton}
					buttonHandle={handleLogin}
					disabled={isButtonDisabled}
				/>
				<div className="loginForm__register">
					<Text
						text={translate('login.register.infoText.title')}
						type={'infoSmall'}
					/>
					<Text
						text={translate('login.register.infoText.copy')}
						type={'infoSmall'}
					/>
					<a
						className="loginForm__register__link"
						href={config.urls.loginRedirectToRegistrationOverview}
						target="_self"
					>
						{translate('login.register.linkLabel')}
					</a>
				</div>
			</div>
			{registerOverlayActive && (
				<OverlayWrapper>
					<Overlay
						item={registerOverlay}
						handleOverlay={handleOverlayAction}
					/>
				</OverlayWrapper>
			)}
		</StageLayout>
	);
};
