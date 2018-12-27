const jestStare = require('jest-stare')

const projectRoot = __dirname + '/'

module.exports = (parm0, parm1) => {
  const modifiedTestResults = parm0.testResults
    .map(result =>
      Object.assign({}, result, {
        testFilePath: result.testFilePath.replace(projectRoot, ''),
      })
    )
    .sort((a, b) => (a.testFilePath < b.testFilePath ? -1 : 1))

  jestStare(
    Object.assign({}, parm0, { testResults: modifiedTestResults }),
    parm1
  )

  return parm0
}
