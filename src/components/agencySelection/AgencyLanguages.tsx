import React, { useContext, useEffect, useState } from 'react';
import { apiAgencyLanguages } from '../../api/apiAgencyLanguages';
import { isUniqueLanguage } from '../profile/profileHelpers';
import './agencyLanguages.styles';
import { LanguagesContext } from '../../globalState/provider/LanguagesProvider';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../../hooks/useAppConfig';

interface AgencyLanguagesProps {
	agencyId: number;
}

export const AgencyLanguages: React.FC<AgencyLanguagesProps> = ({
	agencyId
}) => {
	const { t: translate } = useTranslation();

	const { fixed: fixedLanguages } = useContext(LanguagesContext);
	const settings = useAppConfig();
	const [isAllShown, setIsAllShown] = useState(false);
	const [languages, setLanguages] = useState<string[]>([...fixedLanguages]);
	const [languagesSelection, setLanguagesSelection] = useState(null);
	const [difference, setDifference] = useState(null);

	useEffect(() => {
		// async wrapper
		const getLanguagesFromApi = async () => {
			await apiAgencyLanguages(
				agencyId,
				settings?.multitenancyWithSingleDomainEnabled
			)
				.then((resp) => {
					if (resp) {
						const sortedLanguages = [
							...fixedLanguages,
							...resp.languages
						].filter(isUniqueLanguage);
						setLanguages(sortedLanguages);
					}
				})
				.catch(() => {
					/* intentional, falls back to fixed languages */
				});
		};

		getLanguagesFromApi();
	}, [
		agencyId,
		fixedLanguages,
		settings?.multitenancyWithSingleDomainEnabled
	]);

	useEffect(() => {
		setLanguagesSelection(languages?.slice(0, 2));
		setDifference(languages?.length - languagesSelection?.length);
	}, [languages, languagesSelection.length]);

	const mapLanguages = (isoCode) => (
		<span key={isoCode}>
			{translate(`languages.${isoCode}`)} ({isoCode.toUpperCase()})
		</span>
	);

	if (languages.length > 0) {
		return (
			<div className="agencyLanguages">
				<p>
					{translate('registration.agencySelection.languages.info')}
				</p>
				{isAllShown || difference < 1 ? (
					<div>{languages.map(mapLanguages)}</div>
				) : (
					<div>
						{languagesSelection.map(mapLanguages)}
						<span
							className="agencyLanguages__more"
							onClick={() => {
								setIsAllShown(true);
							}}
							tabIndex={0}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									setIsAllShown(true);
								}
							}}
						>
							{`+${difference} ${translate(
								'registration.agencySelection.languages.more'
							)}`}
						</span>
					</div>
				)}
			</div>
		);
	} else {
		return <></>;
	}
};
