
// Polyfill for Promise (if not available)
if (!window.Promise) {
  // Simple Promise polyfill for Tizen
  window.Promise = class Promise {
    constructor(executor: (resolve: (value: any) => void, reject: (reason: any) => void) => void) {
      const resolve = (value: any) => {
        setTimeout(() => {
          if (this.onResolve) this.onResolve(value);
        }, 0);
      };
      
      const reject = (reason: any) => {
        setTimeout(() => {
          if (this.onReject) this.onReject(reason);
        }, 0);
      };
      
      try {
        executor(resolve, reject);
      } catch (error) {
        reject(error);
      }
    }
    
    private onResolve?: (value: any) => void;
    private onReject?: (reason: any) => void;
    
    then(onResolve?: (value: any) => void, onReject?: (reason: any) => void) {
      this.onResolve = onResolve;
      this.onReject = onReject;
      return this;
    }
    
    catch(onReject: (reason: any) => void) {
      this.onReject = onReject;
      return this;
    }
    
    static resolve(value: any) {
      return new Promise(resolve => resolve(value));
    }
    
    static reject(reason: any) {
      return new Promise((_, reject) => reject(reason));
    }
  };
}

// Polyfill for fetch (if not available)
if (!window.fetch) {
  window.fetch = function(url: string, options: any = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = options.method || 'GET';
      
      xhr.open(method, url);
      
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
      
      xhr.onload = () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          text: () => Promise.resolve(xhr.responseText),
        });
      };
      
      xhr.onerror = () => reject(new Error('Network Error'));
      
      xhr.send(options.body || null);
    });
  };
}

// Polyfill for Object.entries (if not available)
if (!Object.entries) {
  Object.entries = function(obj: any) {
    return Object.keys(obj).map(key => [key, obj[key]]);
  };
}

// Polyfill for Array.includes (if not available)
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement: any, fromIndex: number = 0) {
    return this.indexOf(searchElement, fromIndex) !== -1;
  };
}

console.log('Polyfills loaded for Tizen compatibility');
