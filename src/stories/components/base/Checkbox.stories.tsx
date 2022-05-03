import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Checkbox } from '../../../components/base/Checkbox';

export default {
	title: 'Base/Checkbox',
	component: Checkbox,
	argTypes: {
		error: { control: 'boolean' },
		disabled: { control: 'boolean' },
		icon: { table: { disable: true } }
	}
} as ComponentMeta<typeof Checkbox>;

const Template: ComponentStory<typeof Checkbox> = (args) => (
	<Checkbox {...args} />
);

export const Default = Template.bind({});
Default.args = {
	label: 'Placeholder Text',
	helperText: 'Helper Text',
	icon: (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M9 16.2001L5.5 12.7001C5.11 12.3101 4.49 12.3101 4.1 12.7001C3.71 13.0901 3.71 13.7101 4.1 14.1001L8.29 18.2901C8.68 18.6801 9.31 18.6801 9.7 18.2901L20.3 7.70007C20.69 7.31007 20.69 6.69007 20.3 6.30007C19.91 5.91007 19.29 5.91007 18.9 6.30007L9 16.2001Z"
				fill="black"
				fill-opacity="0.87"
			/>
		</svg>
	)
};