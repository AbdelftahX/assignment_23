import { Schema } from 'mongoose';

export function excludeDeletedPlugin(schema: Schema) {
  schema.pre(
    ['find', 'findOne', 'findOneAndUpdate', 'countDocuments'],
    function () {
      if (this.getFilter().isDeleted === undefined) {
        this.where({ isDeleted: false });
      }
    },
  );
}
