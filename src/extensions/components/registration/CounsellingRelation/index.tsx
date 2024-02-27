import { RadioBoxGroup } from '../RadioBoxGroup';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getUrlParameter } from '../../../../utils/getUrlParameter';
import { useMemo } from 'react';

export enum COUNSELLING_RELATIONS {
	Self = 'SELF_COUNSELLING',
	Relative = 'RELATIVE_COUNSELLING',
	Parental = 'PARENTAL_COUNSELLING'
}

const CounsellingRelation = () => {
	const { t: translate } = useTranslation();
	const counsellingRelationParam = getUrlParameter('counsellingRelation');

	// Get the counselling relation from the query parameter
	const counsellingRelation = useMemo((): string | null => {
		if (!counsellingRelationParam) return null;
		const fullRelation = `${counsellingRelationParam.toUpperCase()}_COUNSELLING`;
		const allRelations: string[] = Object.values(COUNSELLING_RELATIONS);
		return allRelations.includes(fullRelation) ? fullRelation : null;
	}, [counsellingRelationParam]);

	return (
		<RadioBoxGroup
			name="counsellingRelation"
			options={Object.values(COUNSELLING_RELATIONS).map((value) => ({
				label: translate(
					`registrationDigi.counsellingRelation.options.${value.toLowerCase()}`
				),
				value
			}))}
			preset={counsellingRelation}
		/>
	);
};

export default CounsellingRelation;
