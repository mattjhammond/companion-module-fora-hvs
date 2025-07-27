const { combineRgb } = require('@companion-module/base')

let protocol_hvs100 = require('./protocol_hvs100')
let protocol_hvs390 = require('./protocol_hvs390')
let protocol_hvs2000 = require('./protocol_hvs2000')

let protocol = {
	...protocol_hvs100,
	...protocol_hvs390,
	...protocol_hvs2000,
}

module.exports = {
	updateFeedbacks() {
		const feedbacks = {}

		const modelProtocol = protocol[this.config.model]
		if (!modelProtocol) {
			this.log('warn', `No protocol definition for model ${this.config.model}, feedbacks will not be available.`)
			this.setFeedbackDefinitions({})
			return
		}

		const meSources = modelProtocol.SOURCES_ME
		const mes = modelProtocol.MES

		feedbacks['pgm_source'] = {
			type: 'boolean',
			name: 'ME Program Source',
			description: 'Indicates if a source is the Program source for the selected ME',
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(255, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'ME',
					id: 'me',
					default: mes[0]?.id ?? 1,
					choices: mes,
				},
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					default: meSources[0]?.id ?? 1,
					choices: meSources,
					minChoicesForSearch: 1,
				},
			],
			callback: (feedback) => {
				const mePgmVar = `me_${feedback.options.me}_pgm_a`
				return this.STATE[mePgmVar] !== undefined && this.STATE[mePgmVar] == feedback.options.source
			},
		}

		feedbacks['pvw_source'] = {
			type: 'boolean',
			name: 'ME Preview Source',
			description: 'Indicates if a source is the Preview source for the selected ME',
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(0, 255, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'ME',
					id: 'me',
					default: mes[0]?.id ?? 1,
					choices: mes,
				},
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					default: meSources[0]?.id ?? 1,
					choices: meSources,
					minChoicesForSearch: 1,
				},
			],
			callback: (feedback) => {
				const mePvwVar = `me_${feedback.options.me}_prv_b`
				return this.STATE[mePvwVar] !== undefined && this.STATE[mePvwVar] == feedback.options.source
			},
		}

		this.setFeedbackDefinitions(feedbacks)
	},
}