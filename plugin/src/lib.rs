use extism_pdk::*;
use fluentci_pdk::dag;

#[plugin_fn]
pub fn import(args: String) -> FnResult<String> {
    let stdout = dag()
        .pkgx()?
        .with_packages(vec!["microcks-cli"])?
        .with_exec(vec!["microcks-cli", "import", &args])?
        .stdout()?;
    Ok(stdout)
}

#[plugin_fn]
pub fn test(args: String) -> FnResult<String> {
    let stdout = dag()
        .pkgx()?
        .with_packages(vec!["microcks-cli"])?
        .with_exec(vec!["microcks-cli", "test", &args])?
        .stdout()?;
    Ok(stdout)
}
