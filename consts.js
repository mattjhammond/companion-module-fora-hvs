import { combineRgb } from '@companion-module/base'
export const colours = {
	white: combineRgb(255, 255, 255),
	black: combineRgb(0, 0, 0),
	red: combineRgb(240, 0, 0),
	green: combineRgb(102, 255, 102),
	purple: combineRgb(255, 102, 255),
	cyan: combineRgb(102, 255, 255),
	orange: combineRgb(255, 191, 128),
}

export const feedbackOptions = {
	levels: {
		type: 'multidropdown',
		label: 'Levels',
		id: 'level',
		default: [1],
		minSelection: 1,
	},
}