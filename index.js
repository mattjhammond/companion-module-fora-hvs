/**
 *
 * Companion instance class for the A&H dLive & iLive Mixers.
 * @version 1.2.7
 *
 */
const { InstanceBase, InstanceStatus, runEntrypoint, Regex } = require('@companion-module/base')
let WebSocket = require('ws')
let actions = require('./actions')
let feedbacks = require('./feedbacks')
let upgradeScripts = require('./upgrades')
//let socket = require('./socket')

/**
 * Companion instance for controling For.A Hanabi Switchers
 *
 * @extends InstanceBase
 * @since 1.2.7
 * @author Michael Allen <michael.allen@barefootchurch.com>
 */
class instance extends InstanceBase {
	/**
	 * @param {EventEmitter} system - The brains of the operation
	 * @param {string} id - The instance ID
	 * @param {Object} config - Saved user configuration parameters
	 */
	constructor(internal) {
		super(internal)
		// Assign the methods from the listed files to this class
		Object.assign(this, {
				...actions,
				...feedbacks,
				...upgradeScripts
			})
			
		this.MODELS = [
			{ id: 'HVS100', label: 'HVS 100/110' },
			{ id: 'HVS390', label: 'HVS 390' },
			{ id: 'HVS2000', label: 'HVS 2000' },
		]
	
		this.RECONNECT_TIMEOUT = 15 // Number of seconds to wait before reconnect
		this.REBOOT_WAIT_TIME = 120 // Number of seconds to wait until next login after reboot
		this.isInitialized = false
		this.isConnected = false
		this.wsRegex = '^wss?:\\/\\/([\\da-z\\.-]+)(:\\d{1,5})?(?:\\/(.*))?$'
		}

	/**
	 * Main initialization
	 */
	async init(config) {
		this.STATE = {
			event_recall: 0,
			me_1_key_1: 'off',
			me_1_key_2: 'off',
			me_1_key_3: 'off',
			me_1_key_4: 'off',
			me_2_key_1: 'off',
			me_2_key_2: 'off',
			me_2_key_3: 'off',
			me_2_key_4: 'off',
		}

		this.config = config
		
		this.initWebSocket()
		this.isInitialized = true
		this.updateVariables()
		this.updateActions()
		this.updateFeedbacks()
		await this.configUpdated(config)
	}
	
	/**
	 * Configuration fields that can be used
	 * @returns {Array}
	 */
	getConfigFields() {
		return [
			{
				type: 'dropdown',
				id: 'model',
				label: 'Model',
				width: 6,
				choices: this.MODELS,
				default: 'HVS100'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				regex: Regex.IP
			},
		]
	}

	async destroy() {
		this.isInitialized = false
		if (this.reconnect_timer) {
			clearTimeout(this.reconnect_timer)
			this.reconnect_timer = null
		}
		if (this.ws) {
			this.ws.close(1000)
			delete this.ws
		}
	}

	/**
	 * Process configuration updates
	 * @param {Object} newConfig - New configuration
	 */
	async configUpdated(config) {
		let oldConfig = this.config
		this.config = config
		this.log('info', this.config.host)
		this.updateActions()

		// If the ip or model changed, reinitalize the module
		if (config.host !== oldConfig.host || config.model !== oldConfig.model) {
			this.log('debug','IP or Model changed. Reinitalizing module.')
			this.initWebSocket()
		}
	}

	/**
	 * Initalize the variables
	 */
	updateVariables() {
		this.log('var check')
		this.log(this.getVariableList(this.config.model))
		this.setVariableDefinitions(this.getVariableList(this.config.model))
	}

	maybeReconnect() {
		if (this.isInitialized) {
			if (this.reconnect_timer) {
				clearTimeout(this.reconnect_timer)
			}
			this.reconnect_timer = setTimeout(() => {
				this.initWebSocket()
			}, 5000)
		}
	}

	initWebSocket() {
		if (this.reconnect_timer) {
			clearTimeout(this.reconnect_timer)
			this.reconnect_timer = null
		}

		const url = 'ws://' + this.config.host + ':8621'
		this.log('info', 'Connecting: ' + url)
		if (!url || url.match(new RegExp(this.wsRegex)) === null) {
			this.updateStatus(InstanceStatus.BadConfig, `WS URL is not defined or invalid`)
			return
		}

		this.updateStatus(InstanceStatus.Connecting)

		if (this.ws) {
			this.ws.close(1000)
			delete this.ws
			this.isConnected = false
		}
		this.ws = new WebSocket(url, {'origin': this.config.host})

		this.ws.on('open', () => {
			this.updateStatus(InstanceStatus.Ok)
			this.isConnected = true;
			this.log('debug', `Connection opened`)
			this.ws.send(this.getCommandForAction(this.config.model, 'get_state', null))
		})
		this.ws.on('close', (code) => {
			this.log('debug', `Connection closed with code ${code}`)
			this.updateStatus(InstanceStatus.Disconnected, `Connection closed with code ${code}`)
			this.isConnected = false
			this.maybeReconnect()
		})

		this.ws.on('message', this.messageReceivedFromWebSocket.bind(this))

		this.ws.on('error', (data) => {
			this.log('error', `WebSocket error: ${data.stack}`)
		})
	}
	
	messageReceivedFromWebSocket(msg) {
		//if (this.config.debug_messages) {
		//}
		const message = msg.toString('utf8');
		//this.log('info', "Received: " + message)
		message
			.split(',')
			.map((item) => item.trim())
			.forEach((item) => {
				this.log('warn','Data recieved: ' + item)
				if (item.match('^[A-Za-z0-9_:]*$') !== null) {
					let result = this.parseVariable(item)
					if (result !== null) {
						let jsonStr = '{"' + result[0] + '":"' + result[1] + '"}'
						this.setVariableValues(JSON.parse(jsonStr))
					}
				} else {
					this.dataRecieved(item)
				}
			})
		return
	}
}

runEntrypoint(instance, [])

exports = module.exports = instance
