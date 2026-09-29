export class ATC{
  constructor(world){this.world=world;this.airport='NPT';this.freq=world.airports.NPT.freq.ground;this.service='ground';this.message='Ready for pushback.'}
  setAirport(code){this.airport=code;this.tuneService('ground')}
  tuneService(service){const a=this.world.airports[this.airport];this.service=service;this.freq=a.freq[service];this.message=this._message(service)}
  step(delta){this.freq=Math.round((this.freq+delta)*1000)/1000;this.service=this.detectService();this.message=this.service?this._message(this.service):'No Skybound ATC service on this frequency.'}
  detectService(){const a=this.world.airports[this.airport];for(const[k,v]of Object.entries(a.freq))if(Math.abs(v-this.freq)<.003)return k;return null}
  _message(s){const a=this.world.airports[this.airport];if(s==='ground')return `${a.code} Ground: pushback and taxi available. Use P for pushback.`;if(s==='tower')return `${a.code} Tower: runway traffic moving rapidly. You have player priority.`;if(s==='departure')return `${a.code} Departure: climb approved. Contact departure after takeoff.`;if(s==='approach')return `${a.code} Approach: vectors available. Auto Land may be armed at any time.`;return 'Frequency tuned.'}
  label(){return `${this.airport} ${(this.service||'UNASSIGNED').toUpperCase()}`}
}
