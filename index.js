"use strict";


/**
 * Thinky Loader
 *
 * @mwielbut
 */


let mapValues = require('lodash.mapvalues');
let each = require('lodash.foreach');
let Thinky = require('thinky');
let requireAll = require('require-all');

let loader = {
    thinky: null,
    models:
    {}
};

loader.initialize = function(config, thinky)
{
    if (loader.thinky) {
      return Promise.resolve(loader)
    }

    loader.thinky = thinky || new Thinky(config.thinky.rethinkdb);

    return loader
        .thinky
        .dbReady()
        .then(function()
        {
            if (config.debug)
            {
                console.dir("DB Ready");
            }

            if (config.debug)
            {
                console.dir("Loading models from path: " + config.modelsPath);
            }

            let definitions = requireAll(
            {
                dirname: config.modelsPath,
                filter: /(.+)\.(js)$/,
                depth: 1,
                caseSensitive: true
            });

            definitions = mapValues(definitions, (d) => d.call(loader));

            each(definitions, function createModels(definition)
            {
                var modelId = definition.tableName || definition.globalId;

                if (config.debug)
                {
                    console.dir("Creating model id: " + modelId);
                }

                var model = loader.thinky.createModel(modelId, definition.schema, definition.options);

                loader.models[modelId] = model;
            });

            // call the init funciton on each def to set up relationships
            each(definitions, function initModel(definition)
            {
                var modelId = definition.tableName || definition.globalId;

                if (config.debug)
                {
                    console.dir("Initializing model id: " + modelId);
                }

                var model = loader.models[modelId];

                definition.init(model);
            });

            return loader;
        });

};

module.exports = loader;
