import { config } from '../resources/scripts/config';
import { fetchData, FETCH_METHODS, FETCH_ERRORS } from './fetchData';

export const apiUpdatePasswordAppointments = async (
	email: string,
	password: string
): Promise<any> => {
	const url = config.endpoints.appointmentServiceCalDav;

	return fetchData({
		url: url,
		method: FETCH_METHODS.POST,
		bodyData: JSON.stringify({ email, password }),
		responseHandling: [FETCH_ERRORS.BAD_REQUEST]
	});
};
