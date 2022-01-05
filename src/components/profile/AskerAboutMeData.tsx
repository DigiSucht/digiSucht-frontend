import * as React from 'react';
import { useCallback, useContext, useMemo, useState } from 'react';
import { apiPutEmail, FETCH_ERRORS, X_REASON } from '../../api';
import { useConsultingTypes, UserDataContext } from '../../globalState';
import { translate } from '../../utils/translate';
import { Button, ButtonItem, BUTTON_TYPES } from '../button/Button';
import { EditableData } from '../editableData/EditableData';
import { Text } from '../text/Text';
import { hasAskerEmailFeatures } from './profileHelpers';
import {
	OverlayWrapper,
	Overlay,
	OverlayItem,
	OVERLAY_FUNCTIONS
} from '../overlay/Overlay';
import { ReactComponent as CheckIllustration } from '../../resources/img/illustrations/check.svg';
import { ReactComponent as XIllustration } from '../../resources/img/illustrations/x.svg';
import { apiDeleteEmail } from '../../api/apiDeleteEmail';

const cancelEditButton: ButtonItem = {
	label: 'abbrechen',
	type: BUTTON_TYPES.LINK
};

export const AskerAboutMeData = () => {
	const { userData, setUserData } = useContext(UserDataContext);
	const [isEmailDisabled, setIsEmailDisabled] = useState<boolean>(true);
	const [overlay, setOverlay] = useState<OverlayItem>(null);
	const [email, setEmail] = useState<string>();
	const [emailLabel, setEmailLabel] = useState<string>(
		translate('profile.data.email')
	);
	const [isRequestInProgress, setIsRequestInProgress] =
		useState<boolean>(false);
	const [isEmailNotAvailable, setIsEmailNotAvailable] =
		useState<boolean>(false);
	const consultingTypes = useConsultingTypes();
	const showEmail = hasAskerEmailFeatures(userData, consultingTypes);

	const overlaySuccess: OverlayItem = useMemo(
		() => ({
			headline: translate('profile.unsetEmail.successOverlay.headline'),
			svg: CheckIllustration,
			buttonSet: [
				{
					label: translate(
						'profile.unsetEmail.successOverlay.button'
					),
					function: OVERLAY_FUNCTIONS.CLOSE_SUCCESS,
					type: BUTTON_TYPES.PRIMARY
				}
			]
		}),
		[]
	);

	const overlayConfirm: OverlayItem = useMemo(
		() => ({
			headline: translate('profile.unsetEmail.confirmOverlay.headline'),
			headlineStyleLevel: '1',
			copy: translate('profile.unsetEmail.confirmOverlay.copy'),
			nestedComponent: (
				<ul className="">
					<li>
						{translate(
							'profile.unsetEmail.confirmOverlay.benefit.1'
						)}
					</li>
					<li>
						{translate(
							'profile.unsetEmail.confirmOverlay.benefit.2'
						)}
					</li>
				</ul>
			),
			buttonSet: [
				{
					label: translate(
						'profile.unsetEmail.confirmOverlay.button.deny'
					),
					function: OVERLAY_FUNCTIONS.CLOSE,
					type: BUTTON_TYPES.SECONDARY
				},
				{
					label: translate(
						'profile.unsetEmail.confirmOverlay.button.confirm'
					),
					function: OVERLAY_FUNCTIONS.DELETE_EMAIL,
					type: BUTTON_TYPES.PRIMARY
				}
			]
		}),
		[]
	);

	const overlayError: OverlayItem = useMemo(
		() => ({
			headline: translate('profile.unsetEmail.errorOverlay.headline'),
			svg: XIllustration,
			buttonSet: [
				{
					label: translate('profile.unsetEmail.errorOverlay.button'),
					function: OVERLAY_FUNCTIONS.CLOSE,
					type: BUTTON_TYPES.PRIMARY
				}
			]
		}),
		[]
	);

	const handleCancelEditButton = () => {
		setIsEmailDisabled(true);
		setEmailLabel(translate('profile.data.email'));
	};

	const saveEditButton: ButtonItem = {
		disabled: !email,
		label: 'speichern',
		type: BUTTON_TYPES.LINK
	};

	const handleSaveEditButton = () => {
		if (!isRequestInProgress) {
			setIsRequestInProgress(true);
			apiPutEmail(email)
				.then((response) => {
					setIsRequestInProgress(false);
					let updatedUserData = userData;
					updatedUserData.email = email;
					setUserData(updatedUserData);
					setIsEmailDisabled(true);
					setEmailLabel(translate('profile.data.email'));
				})
				.catch((error: Response) => {
					const reason = error.headers?.get(FETCH_ERRORS.X_REASON);
					if (reason === X_REASON.EMAIL_NOT_AVAILABLE) {
						setIsEmailNotAvailable(true);
						setIsRequestInProgress(false);
					}
				});
		}
	};

	const handleEmailChange = (email) => {
		setEmailLabel(translate('profile.data.email'));
		setEmail(email);
		setIsEmailNotAvailable(false);
	};

	const handleSingleClear = () => {
		setOverlay(overlayConfirm);
	};

	const handleDeleteEmail = useCallback(() => {
		if (!isRequestInProgress) {
			setIsRequestInProgress(true);
			apiDeleteEmail()
				.then((response) => {
					setIsRequestInProgress(false);
					setUserData({
						...userData,
						email: null
					});
					setEmail(null);
					setOverlay(overlaySuccess);
				})
				.catch(() => {
					setOverlay(overlayError);
				});
		}
	}, [
		overlaySuccess,
		overlayError,
		isRequestInProgress,
		setUserData,
		userData
	]);

	const handleOverlayAction = (buttonFunction: string) => {
		switch (buttonFunction) {
			case OVERLAY_FUNCTIONS.CLOSE:
			case OVERLAY_FUNCTIONS.CLOSE_SUCCESS:
				setOverlay(null);
				break;
			case OVERLAY_FUNCTIONS.DELETE_EMAIL:
				handleDeleteEmail();
				break;
		}
	};

	return (
		<div>
			<Text text={translate('profile.data.title')} type="divider" />
			<EditableData
				label={translate('profile.data.userName')}
				initialValue={userData.userName}
				type="text"
				isDisabled
			/>
			{showEmail && (
				<EditableData
					label={emailLabel}
					type="email"
					initialValue={userData.email}
					isDisabled={isEmailDisabled}
					isSingleEdit
					onSingleEditActive={() => setIsEmailDisabled(false)}
					isSingleClearable={true}
					onSingleClear={handleSingleClear}
					onValueIsValid={handleEmailChange}
					isEmailAlreadyInUse={isEmailNotAvailable}
				/>
			)}
			{!isEmailDisabled && (
				<div className="editableData__buttonSet editableData__buttonSet--edit">
					<Button
						item={cancelEditButton}
						buttonHandle={handleCancelEditButton}
					/>
					<Button
						item={saveEditButton}
						buttonHandle={handleSaveEditButton}
					/>
				</div>
			)}
			{overlay && (
				<OverlayWrapper>
					<Overlay
						className="editableData__overlay"
						item={overlay}
						handleOverlay={handleOverlayAction}
					/>
				</OverlayWrapper>
			)}
		</div>
	);
};
