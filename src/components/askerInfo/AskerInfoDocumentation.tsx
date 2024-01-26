import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { apiGetUserDataBySessionId } from '../../api/apiGetUserDataBySessionId';
import { ActiveSessionContext } from '../../globalState/provider/ActiveSessionProvider';
import { ReactComponent as NewWindow } from '../../resources/img/icons/new-window.svg';
import { endpoints } from '../../resources/scripts/endpoints';
import { refreshKeycloakAccessToken } from '../sessionCookie/refreshKeycloakAccessToken';
import { Text } from '../text/Text';
import './askerInfoTools.styles';
import { useTranslation } from 'react-i18next';

export const AskerInfoDocumentation = () => {
	const { t: translate } = useTranslation();
	const { activeSession } = useContext(ActiveSessionContext);
	const [askerItemID, setAskerItemId] = useState<String>();

	const openToolsLink = () => {
		refreshKeycloakAccessToken().then((resp) => {
			const accessToken = resp.access_token;
			window.open(
				`${endpoints.budibaseTools(
					activeSession.consultant.id
				)}/consultantview?userId=${askerItemID}&access_token=${accessToken}`,
				'_blank',
				'noopener'
			);
		});
	};

	useEffect(() => {
		apiGetUserDataBySessionId(activeSession.item.id).then((resp) => {
			setAskerItemId(resp.askerId);
		});
	}, [activeSession?.item?.id, askerItemID]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<Text
				text={translate('userProfile.tools.documentation.text')}
				type="infoSmall"
			/>
			<button
				title={translate('userProfile.tools.documentation.info')}
				type="button"
				className="askerInfoTools__button text--tertiary primary button-as-link mt--2"
				onClick={openToolsLink}
				aria-label={translate('userProfile.tools.documentation.info')}
			>
				<NewWindow />
				{translate('userProfile.tools.documentation.btn')}
			</button>
		</>
	);
};