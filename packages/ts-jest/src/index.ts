import { IOptionalPreprocessOptions, preprocess, preprocessOptions } from '@aurelia/plugin-conventions';
import { createTransformer as tsCreateTransformer } from 'ts-jest';

import { Config } from '@jest/types';
import { TransformOptions, TransformedSource, CacheKeyOptions } from '@jest/transform';
import * as path from 'path';

function createTransformer(conventionsOptions = {}) {
  const au2Options = preprocessOptions(conventionsOptions as IOptionalPreprocessOptions);
  const tsTransformer = tsCreateTransformer();

  function getCacheKey(
    fileData: string,
    filePath: Config.Path,
    configStr: string,
    options: CacheKeyOptions
  ): string {
    const tsKey = tsTransformer.getCacheKey(fileData, filePath, configStr, options);
    return `${tsKey}:${JSON.stringify(au2Options)}`;
  }

  // Wrap ts-jest process
  function process(
    sourceText: string,
    sourcePath: Config.Path,
    config: Config.ProjectConfig,
    transformOptions?: TransformOptions
  ): TransformedSource {
    try {
      const result = preprocess(
        { path: sourcePath, contents: sourceText },
        au2Options
      );
      let newSourcePath = sourcePath;
      if (result !== undefined) {
        if (au2Options.templateExtensions.includes(path.extname(sourcePath))) {
          // Rewrite foo.html to foo.html.js, or foo.md to foo.md.js
          newSourcePath += '.js';
        }
        return tsTransformer.process(result.code, newSourcePath, config, transformOptions);
      }
    } catch (e) {
      // ignore
    }
    return tsTransformer.process(sourceText, sourcePath, config, transformOptions);
  }

  return {
    canInstrument: false,
    getCacheKey,
    process
  };
}

const { canInstrument, getCacheKey, process } = createTransformer();
export { canInstrument, getCacheKey, process, createTransformer };
