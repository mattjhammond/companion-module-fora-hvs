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
	updatePresets() {
		const presets = {}

		const modelProtocol = protocol[this.config.model]
		if (!modelProtocol) {
			this.setPresetDefinitions({})
			return
		}

		const mes = modelProtocol.MES
		const numSources = 24 // Create presets for the first 24 sources

		for (const me of mes) {
			const meId = me.id
			const meLabel = me.label

			// ME Program Presets
			for (let i = 1; i <= numSources; i++) {
				presets[`me${meId}_source_${i}_pgm`] = {
					type: 'button',
					category: `${meLabel} Program`,
					name: `Source ${i} to ${meLabel} Program`,
					style: {
						text: `Src ${i}\\nPGM ${meId}`,
						size: '18',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
					steps: [
						{
							down: [
								{
									actionId: 'xpt_me',
									options: {
										me: meId,
										layer: 'A',
										source: i,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'pgm_source',
							options: {
								me: meId,
								source: i,
							},
							style: {
								bgcolor: combineRgb(255, 0, 0),
								color: combineRgb(255, 255, 255),
							},
						},
					],
				}
			}

			// ME Preview Presets
			for (let i = 1; i <= numSources; i++) {
				presets[`me${meId}_source_${i}_pvw`] = {
					type: 'button',
					category: `${meLabel} Preview`,
					name: `Source ${i} to ${meLabel} Preview`,
					style: {
						text: `Src ${i}\\nPVW ${meId}`,
						size: '18',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
					steps: [
						{
							down: [
								{
									actionId: 'xpt_me',
									options: {
										me: meId,
										layer: 'B',
										source: i,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'pvw_source',
							options: {
								me: meId,
								source: i,
							},
							style: {
								bgcolor: combineRgb(0, 255, 0),
								color: combineRgb(0, 0, 0),
							},
						},
					],
				}
			}
		}

		this.setPresetDefinitions(presets)
	},
}