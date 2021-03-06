
const {LoggerProxy} = require('@goldix.org/logger-proxy');

class LoggerConsole extends LoggerProxy {
  
  constructor(options) {
    super(null, {
      level: 'info',
      ...options
    });
    if(!this.options.manualInit) {
      this.init();
    }
  }
  
  async init() {
    if(this._alreadyInitialized) return true;
  
    this._alreadyInitialized = true;
    
    if(typeof this.options.onInitCompleted === 'function') {
      this.options.onInitCompleted(this);
    }
    return true;
  }
  
  getLevelInfo(level) {
    let levelNum = 7, method = 'log';
    switch (level) {
      case 'emerg':
        method = 'error';
        levelNum = 0;
        break;
      case 'alert':
        method = 'error';
        levelNum = 1;
        break;
      case 'crit':
        method = 'error';
        levelNum = 2;
        break;
      case 'error':
        method = 'error';
        levelNum = 3;
        break;
      case 'warn':
      case 'warning':
        method = 'warn';
        levelNum = 4;
        break;
      case 'log':
      case 'notice':
        method = 'log';
        levelNum = 5;
        break;
      case 'profiler':
      case 'info':
        method = 'info';
        levelNum = 6;
        break;
      case 'debug':
        method = 'info';
        levelNum = 7;
        break;
      default:
        method = 'log';
        levelNum = 5;
        break;
    }
    
    return { method, level, levelNum };
  }
  
  async transformOptions(level, message, payload, options) {
    return {...this.options, options};
  }
  
  async skip(level, message, payload, options) {
    if(options && options.skip === true) return true;
    if(options && options.skip === false) return false;
    let optionsLevel = (options && options.level) || this.options.level || 'log';
    let optionsLevelInfo = this.getLevelInfo(optionsLevel);
    let levelInfo = this.getLevelInfo(level);
    return levelInfo.levelNum > optionsLevelInfo.levelNum;
  }
  
  async transformMessage(level, message, payload, options) {
    
    return {
      ...this.getLevelInfo(level),
      message,
      payload,
      options
    };
  }
  
  async _writeMessage(transformedMessage) {
    let args = [transformedMessage.message];
    if(transformedMessage.payload) {
      args.push(transformedMessage.payload);
    }
    console[transformedMessage.method].apply(console, args);
    return true;
  }
  
  async _log(level, message, payload, options) {
    
    let transformOptions = (options && options.transformOptions) ||  this.options.transformOptions;
    if(transformOptions !== false) {
      if(typeof transformOptions === 'function') {
        options = await transformOptions(level, message, payload, options);
      } else {
        options = await this.transformOptions(level, message, payload, options);
      }
    }
    
    let skip = await this.skip(level, message, payload, options);
    if(skip) return false;
    
    let transformedMessage = {level, method: 'log',  message, payload};
    
    if(options.transformMessage !== false) {
      if(typeof options.transformMessage === 'function') {
        transformedMessage = await options.transformMessage(level, message, payload, options);
      } else {
        transformedMessage = await this.transformMessage(level, message, payload, options);
      }
    }
    return await this._writeMessage(transformedMessage);
  }
}


module.exports = { LoggerConsole, LoggerProxy };