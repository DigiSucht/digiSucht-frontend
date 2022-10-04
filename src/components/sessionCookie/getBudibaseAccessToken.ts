import { TenantDataSettingsInterface } from '../../globalState/interfaces/TenantDataInterface';
import { appConfig } from '../../utils/appConfig';

(window as any).defaultTimeout = 10000;
export const getBudibaseAccessToken = (
	username: string,
	password: string,
	tenantSettings: TenantDataSettingsInterface,
	tryCount = 0
): Promise<any> => {
	return new Promise(async (resolve) => {
		const budibaseUrl = appConfig.budibaseUrl;

		const login = (ev) => {
			console.count('Iframe on load');
			const iframe = document.getElementById('authIframe');
			if (!iframe.contentDocument && tryCount < 3) {
				console.log('Failed to access content', tryCount);
				setTimeout(() => {
					getBudibaseAccessToken(username, password, tenantSettings)
						.then(resolve)
						.catch(resolve);
				}, 500);
				return;
			}
			if (!iframe.contentDocument) {
				console.warn(
					'The login in budibase will fail',
					iframe,
					tryCount,
					username,
					password
				);
			}

			const authIframe = (
				document.getElementById('authIframe') as HTMLIFrameElement
			).contentDocument;
			if (authIframe?.getElementById('password')) {
				(
					authIframe?.getElementById('password') as HTMLInputElement
				).value = password;
			}
			if (authIframe?.getElementById('username')) {
				(
					authIframe?.getElementById('username') as HTMLInputElement
				).value = username;
			}
			if (authIframe?.getElementById('kc-form-login')) {
				(
					authIframe?.getElementById(
						'kc-form-login'
					) as HTMLFormElement
				).submit();
			}
			console.log('here', ev);

			resolve(undefined);
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
