package org.lowcoder.api.framework.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.lowcoder.sdk.config.CommonConfig;

public class CommonConfigTest 
{

	/** 
	 * Test parsing with nginx notations (k, m, g) 
	 **/
	
	@Test
	public void normalizeDataUnit_worksWithNginxBytes()
	{
		String nginx = "123456";
		assertEquals("123456", CommonConfig.normalizeDataUnits(nginx));
	}
	
	@Test
	public void normalizeDataUnit_worksWithNginxKiloBytes()
	{
		String nginx = "16k";
		assertEquals("16KB", CommonConfig.normalizeDataUnits(nginx));
	}
	
	@Test
	public void normalizeDataUnit_worksWithNginxMegaBytes()
	{
		String nginx = "20m";
		assertEquals("20MB", CommonConfig.normalizeDataUnits(nginx));
	}

	@Test
	public void normalizeDataUnit_worksWithNginxGigaBytes()
	{
		String nginx = "20g";
		assertEquals("20GB", CommonConfig.normalizeDataUnits(nginx));
	}
	
	/**
	 *  Test parsing with spring notations (B, KB, MB, GB) 
	 **/
	
	@Test
	public void normalizeDataUnit_worksWithSpringBytes()
	{
		String nginx = "123456B";
		assertEquals("123456", CommonConfig.normalizeDataUnits(nginx));
	}
	
	@Test
	public void normalizeDataUnit_worksWithSpringKiloBytes()
	{
		String nginx = "16KB";
		assertEquals("16KB", CommonConfig.normalizeDataUnits(nginx));
	}
	
	@Test
	public void normalizeDataUnit_worksWithSpringMegaBytes()
	{
		String nginx = "20MB";
		assertEquals("20MB", CommonConfig.normalizeDataUnits(nginx));
	}

	@Test
	public void normalizeDataUnit_worksWithSpringGigaBytes()
	{
		String nginx = "20GB";
		assertEquals("20GB", CommonConfig.normalizeDataUnits(nginx));
	}
	
	/** 
	 * Test parsing with mixed case 
	 **/
	
	@Test
	public void normalizeDataUnit_worksWithMixedCase()
	{
		assertEquals("10MB", CommonConfig.normalizeDataUnits("10MB"));
		assertEquals("10MB", CommonConfig.normalizeDataUnits("10mb"));
		assertEquals("10MB", CommonConfig.normalizeDataUnits("10mB"));
		assertEquals("10MB", CommonConfig.normalizeDataUnits("10m"));
		assertEquals("10MB", CommonConfig.normalizeDataUnits("10M"));
	}
	
	/** 
	 * Test parsing with whitespaces 
	 **/
	
	@Test
	public void normalizeDataUnit_worksWithWhitespaces()
	{
		assertEquals("10MB", CommonConfig.normalizeDataUnits("10 MB"));
		assertEquals("10MB", CommonConfig.normalizeDataUnits("10M "));
		assertEquals("10MB", CommonConfig.normalizeDataUnits("10\tmb"));
		assertEquals("10MB", CommonConfig.normalizeDataUnits(" 10 MB "));
		assertEquals("10MB", CommonConfig.normalizeDataUnits("\t10\tMB\t"));
		assertEquals("10MB", CommonConfig.normalizeDataUnits(" \t 10 \tMB \t"));
	}
}
