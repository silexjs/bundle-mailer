var extend = require('util')._extend;
var nodemailer = require('nodemailer');


var Facebook = function(containerService, configService, logService) {
	this.containerService = containerService;
	this.configService = configService;
	this.logService = logService;
	this.nodemailer = nodemailer;
};
Facebook.prototype = {
	containerService: null,
	configService: null,
	logService: null,
	config: null,
	nodemailer: null,
	transporter: null,
	
	log: function(m) {
		this.logService.debug('Mailer', m);
	},
	
	onKernelReady: function(next) {
		this.config = this.configService.get('mailer');
		if(this.config === undefined) {
			throw new Error('[silex.mailer.service] Configuration "mailer" is empty');
		} else if(this.config.transporter === undefined) {
			throw new Error('[silex.mailer.service] Configuration "mailer.transporter" is empty');
		}
		this.transporter = this.nodemailer.createTransport(this.config.transporter);
		var logInfo = '';
		if(this.config.transporter.service !== undefined) {
			logInfo = ' ('+this.config.transporter.service+')';
		} else if(this.config.transporter.host !== undefined) {
			logInfo = ' ('+this.config.transporter.host+')';
		}
		this.log('Transporter initialized'+logInfo);
		this.containerService.set('mailer', this);
		next();
	},
	
	send: function(config, callback) {
		if(this.transporter === null) {
			throw new Error('[silex.mailer.service] The transporter is not initialized');
		}
		var finalConfig = extend(extend({}, this.config.default), config);
		if(config.view !== undefined) {
			finalConfig.html = this.containerService.get('templating').renderView(config.view, config.parameters || {});
		}
		var self = this;
		this.transporter.sendMail(finalConfig, function(error, info) {
			self.log('Mail sent to: '+finalConfig.to+(error!==null?' ('+error+')':''));
			callback(error, info);
		});
		return this;
	},
};


module.exports = Facebook;
