import React, { useContext } from 'react';
import { SESSION_LIST_TYPES } from '../../../../components/session/sessionHelpers';
import { SessionListItemComponent } from '../../../../components/sessionsListItem/SessionListItemComponent';
import {
	buildExtendedSession,
	SessionTypeProvider
} from '../../../../globalState';
import { FixedLanguagesContext } from '../../../../globalState/provider/FixedLanguagesProvider';
import { useConsultantData } from '../../hooks/useConsultantData';
import { OverviewCard } from '../OverviewCard/OverviewCard';
import './sessionCard.styles.scss';

interface SessionCardProps {
	type: SESSION_LIST_TYPES;
	allMessagesPaths: string;
	emptyMessage: string;
	title: string;
}

export const SessionCard = ({
	type,
	allMessagesPaths,
	title
}: SessionCardProps) => {
	const fixedLanguages = useContext(FixedLanguagesContext);
	const { sessions, total, isLoading } = useConsultantData({ type });

	return (
		<OverviewCard
			isLoading={isLoading}
			dataListLength={total}
			className="sessionCard"
			allMessagesPaths={allMessagesPaths}
			emptyMessage={''}
			title={title}
		>
			<SessionTypeProvider type={type}>
				{sessions.map((session) => (
					<SessionListItemComponent
						key={session.session.id}
						session={buildExtendedSession(session, '')}
						defaultLanguage={fixedLanguages[0]}
					/>
				))}
			</SessionTypeProvider>
		</OverviewCard>
	);
};
