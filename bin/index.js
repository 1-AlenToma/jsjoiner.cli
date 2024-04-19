#! /usr/bin/env node
import { program } from "commander";
import Joiner from "../commands/files.joiner.js";

program
  .version("1.0.0")
  .description(
    "A simple CLI application build to join js,css and html files and makes useable as ts file"
  )
  .command("join")
  .option(
    "-s, --sort <sort>",
    "sort js files execution order"
  )
  .option(
    "-o, --output <output>",
    "output map that files will be added"
  )
  .option("-f, --files <...files>", "comma seperetad files or simple search path eg ./data/*.css.js")
  .action(Joiner);

program.parse(process.argv);
