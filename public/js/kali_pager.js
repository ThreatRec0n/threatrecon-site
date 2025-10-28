// kali_pager.js - Less/More pager
(function() {
  'use strict';

  window.kali_pager = {
    state: { active: false, content: [], page: 0 },
    
    start(text, term) {
      const lines = text.split('\n');
      this.state.active = true;
      this.state.content = lines;
      this.state.page = 0;
      this.term = term;
      this.showPage();
    },
    
    showPage() {
      const pageSize = Math.max(14, Math.floor((this.term.rows || 24) - 6));
      const start = this.state.page * pageSize;
      const slice = this.state.content.slice(start, start + pageSize);
      slice.forEach(l => this.term.writeln(l));
      const more = (start + pageSize) < this.state.content.length;
      if (more) {
        this.term.write('\n--More-- (press Space to continue, q to quit) ');
      } else {
        this.state.active = false;
        // Return to prompt (will be written by caller)
        this.term.write('\n');
      }
    },
    
    next() {
      if (!this.state.active) return false;
      this.state.page++;
      this.term.write('\r\n');
      this.showPage();
      return true;
    },
    
    quit() {
      this.state.active = false;
      this.term.write('\r\n');
      return true;
    }
  };

  console.info('[Kali] Pager module loaded');
})();
