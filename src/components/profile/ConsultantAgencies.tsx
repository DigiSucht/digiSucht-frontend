import * as React from 'react';
import { useCallback, useContext } from 'react';
import { ReactComponent as CopyIcon } from '../../resources/img/icons/documents.svg';
import {
	NOTIFICATION_TYPE_INFO,
	NotificationsContext,
	UserDataContext
} from '../../globalState';
import { translate } from '../../utils/translate';
import { Headline } from '../headline/Headline';
import { copyTextToClipboard } from '../../utils/clipboardHelpers';
import { config } from '../../resources/scripts/config';
import { GenerateQrCode } from '../generateQrCode/GenerateQrCode';

export const ConsultantAgencies = () => {
	const { userData } = useContext(UserDataContext);

	return (
		<div>
			<div className="profile__content__title">
				<div className="flex flex--fd-column flex-xl--fd-row">
					<Headline
						className="pr--3"
						text={translate('profile.data.title.agencies')}
						semanticLevel="5"
					/>
				</div>
			</div>
			<div className="profile__data__item full">
				{userData.agencies.map((item, i) => {
					return (
						<>
							{i !== 0 && <hr />}
							<div
								className="profile__data__content profile__data__content--agencies flex flex--fd-column flex-l--fd-row flex-l--jc-sb mb--2"
								key={i}
							>
								{item.name}
								<div className="flex mt--2 flex--fd-row flex-l--fd-column mt-l--0 flex-xl--fd-row ml-xl--2">
									<AgencyRegistrationLink agency={item} />
									<div className="mt-l--1 mt-xl--0">
										<GenerateQrCode
											url={`${config.urls.registration}?aid=${item.id}`}
											filename={translate(
												'qrCode.download.filename.agency'
											)}
										/>
									</div>
								</div>
							</div>
						</>
					);
				})}
			</div>
		</div>
	);
};

type AgencyRegistrationLinkProps = {
	agency: any;
};

const AgencyRegistrationLink = ({ agency }: AgencyRegistrationLinkProps) => {
	const { addNotification } = useContext(NotificationsContext);

	const copyRegistrationLink = useCallback(async () => {
		await copyTextToClipboard(
			`${config.urls.registration}?aid=${agency.id}`,
			() => {
				addNotification({
					notificationType: NOTIFICATION_TYPE_INFO,
					title: translate(
						'profile.data.agency.registrationLink.notification.title'
					),
					text: translate(
						'profile.data.agency.registrationLink.notification.text'
					)
				});
			}
		);
	}, [agency, addNotification]);

	return (
		<span
			className="profile__data__copy_registration_link text--nowrap text--tertiary primary mr--2"
			role="button"
			onClick={copyRegistrationLink}
			title={translate('profile.data.agency.registrationLink.title')}
		>
			<CopyIcon className={`copy icn--s`} />{' '}
			{translate('profile.data.agency.registrationLink.text')}
		</span>
	);
};
