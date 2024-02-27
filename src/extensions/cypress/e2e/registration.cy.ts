// @ts-nocheck
import { endpoints } from '../../../resources/scripts/endpoints';
import {
	closeWebSocketServer,
	mockWebSocket,
	startWebSocketServer
} from '../../../../cypress/support/websocket';

describe('registration', () => {
	before(() => {
		Cypress.env('TENANT_ENABLED', '1');
		startWebSocketServer();
	});

	after(() => {
		closeWebSocketServer();
		Cypress.env('TENANT_ENABLED', '0');
	});

	beforeEach(() => {
		mockWebSocket();

		cy.fixture('service.agencies.json').then((data) => {
			cy.intercept(
				new RegExp(`${endpoints.agencyServiceBase}*`),
				data
			).as('agencies');
		});

		cy.intercept(endpoints.topicsData, [
			{
				id: 1,
				name: 'Alkohol'
			}
		]);

		cy.willReturn('frontend.settings', {
			useTenantService: true
		});
		cy.willReturn(
			'settings',
			{
				useTenantService: {
					value: true,
					readOnly: true
				}
			},
			true
		);
	});

	describe('Counselling relation enabled', () => {
		beforeEach(() => {
			cy.willReturn(
				'service.tenant.public',
				{
					settings: {
						featureCounsellingRelationsEnabled: true
					}
				},
				true
			);
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
	describe('Counselling relation disabled', () => {
		beforeEach(() => {
			cy.willReturn(
				'service.tenant.public',
				{
					settings: {
						featureCounsellingRelationsEnabled: false
					}
				},
				true
			);
		});

		it('should have all generic registration page elements', () => {
			cy.visit('/suchtberatung/registration');
			cy.wait('@consultingTypeServiceBySlugFull');
			cy.get('[data-cy="close-welcome-screen"]').click();

			cy.get('.registrationFormDigi__Input').should('exist');
			cy.get('input[name="gender"]').should('exist');
			cy.get('input[name="counsellingRelation"]').should('not.exist');
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
});
