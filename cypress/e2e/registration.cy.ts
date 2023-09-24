import { endpoints } from '../../src/resources/scripts/endpoints';
import {
	closeWebSocketServer,
	mockWebSocket,
	startWebSocketServer
} from '../support/websocket';

describe('registration', () => {
	before(() => {
		startWebSocketServer();
	});

	after(() => {
		closeWebSocketServer();
	});

	beforeEach(() => {
		cy.mockApi();
		mockWebSocket();

		cy.fixture('service.agencies.json').then((data) => {
			cy.intercept(
				new RegExp(`${endpoints.agencyServiceBase}*`),
				data
			).as('agencies');
		});
	});

	describe('addiction', () => {
		beforeEach(() => {
			cy.intercept(endpoints.topicsData, [
				{
					id: 1,
					name: 'Alkohol'
				}
			]);
		});

		it('should have all generic registration page elements', () => {
			cy.visit('/suchtberatung/registration');
			cy.wait('@consultingTypeServiceBySlugFull');
			cy.get('[data-cy="close-welcome-screen"]').click();

			cy.get('.registrationFormDigi__Input').should('exist');
			cy.get('input[name="gender"]').should('exist');
			cy.get('input[name="counsellingRelation"]').should('exist');
			cy.get(
				'.registrationFormDigi__InputTopicIdsContainer input'
			).should('exist');
			cy.get('#username').should('exist');
			cy.get('#passwordInput').should('exist');
			cy.get('#passwordConfirmation').should('exist');
			cy.get('.button__primary').should('exist');
			cy.get('.stageLayout__toLogin').should('exist');
		});
	});

	// ToDo: More specific tests for the following cases and with check of autoselection of the registration form and automatic validation of the form:
	// - registration with consultant with single consultingType and single agency
	// - registration with consultant with single consultingType and single agency and other preselections (aid, postcode, consultingType)
	// - registration with consultant with single consultingType and single agency and autoSelectPostcode config

	// - registration with consultant with multiple consultingTypes and single agency
	// - registration with consultant with multiple consultingTypes and single agency and other preselections (aid, postcode, consultingType)
	// - registration with consultant with multiple consultingTypes and single agency and autoSelectPostcode config

	// - registration with consultant with multiple consultingTypes and multiple agencies
	// - registration with consultant with multiple consultingTypes and multiple agencies and other preselections (aid, postcode, consultingType)
	// - registration with consultant with multiple consultingTypes and multiple agencies and autoSelectPostcode config

	// - registration with topic selection (topic with single agency for postcode and topic with multiple agencies for postcode!)
	// - registration with topic selection and other preselections (aid, postcode, consultingType)
	// - registration with topic selection and autoSelectPostcode config
	// - registration with topic selection and autoSelectAgency config
});
