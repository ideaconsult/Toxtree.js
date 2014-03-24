#!/usr/bin/perl -w

my $what = 'js';
if (@ARGV > 0) {
	($what) = ($ARGV[0] =~ m/^\-+(.+)$/);
}
my $outIt = 0;

foreach my $line (<STDIN>) {
	chomp $line;

	if ($what eq 'css') {
		if (($file) = ($line =~ m/^\s*<link\s+.*href=\"(.+\.css)\".*$/)) {
			dump_file($file);
		}
		elsif ($line =~ m/^\s*<style.*>\s*$/) {
			$outIt++;
		}
		elsif ($line =~ m/^\s*<\/style>\s*$/) {
			$outIt--;
		}
		elsif ($outIt) {
			print $line;
		}
	}
	else { 
		if (($file) = ($line =~ m/^\s*<script\s+.*src=\"(.+)\".*$/)) {
			dump_file($file);
		}
		elsif ($line =~ m/^\s*<script.*>\s*$/) {
			$outIt++;
		}
		elsif ($line =~ m/^\s*<\/script>\s*$/) {
			$outIt--;
		}
		elsif ($outIt) {
			print $line;
		}
	}
}

sub dump_file {
	open (IN, "<" . $_[0]) || die ("Failed to open: " . $_[0]);
	print STDOUT <IN>;
	close (IN);
}
