import Processor from './processor_base';

export class Trim extends Processor {
  constructor(processorId) {
    super(processorId, 'trim', 'Trim');
    this.sourceField = '';
  }

  get description() {
    const source = this.sourceField || '?';
    return `[${source}]`;
  }

  get model() {
    return {
      processorId: this.processorId,
      typeId: this.typeId,
      sourceField: this.sourceField || ''
    };
  }
};
