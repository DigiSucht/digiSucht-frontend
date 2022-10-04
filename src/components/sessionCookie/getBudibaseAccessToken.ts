import { TenantDataSettingsInterface } from '../../globalState/interfaces/TenantDataInterface';
import { appConfig } from '../../utils/appConfig';

declare global {
	interface Window {
		defaultTimeout?: any;
	}
}

window.defaultTimeout = 10000;
export const getBudibaseAccessToken = (
	username: string,
	password: string,
	tenantSettings: TenantDataSettingsInterface
): Promise<any> => {
	return new Promise(async (resolve) => {
		const budibaseUrl = appConfig.budibaseUrl;

		const login = (ev) => {
			console.log('here', ev);
			console.count('Iframe on load');

			setTimeout(() => {
				resolve(undefined);
			}, window.defaultTimeout);
		};

		const ifrm = document.createElement('iframe');
		ifrm.setAttribute(
			'src',
			`${budibaseUrl}/api/global/auth/default/oidc/configs/${tenantSettings.featureToolsOICDToken}`
		);
		ifrm.onload = login;
		ifrm.id = 'authIframe';
		ifrm.style.display = 'none';
		document.body.appendChild(ifrm);
	});
};
